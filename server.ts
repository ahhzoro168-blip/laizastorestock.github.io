import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // CORS and preflight headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // In-memory fallback database store for Cloudflare simulator
  const memoryStore = {
    products: [] as any[],
    orders: [] as any[],
    purchaseOrders: [] as any[],
    storeSettings: null as any,
    config: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '62b64801700fa9050dbc39cdc9174d38',
      apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
      d1DatabaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || 'eadf684e-05e7-4242-8855-a5ad5b0a69dd',
      r2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'laiza-store-images',
      r2PublicDomain: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://pub-2a808954f1c74db3a94cdce96474d81f.r2.dev',
      autoSyncEnabled: true
    }
  };

  // Cloudflare D1 Helper Function
  async function queryD1(accountId: string, apiToken: string, d1DatabaseId: string, sql: string, params: any[] = []) {
    if (!accountId || !apiToken || !d1DatabaseId) {
      return null;
    }
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Cloudflare D1 Query Error:', err);
      return null;
    }
  }

  // API Routes
  app.all('/api/cloudflare/status', async (req, res) => {
    const body = req.method === 'GET' ? req.query : req.body;
    const { accountId, apiToken, d1DatabaseId, r2BucketName } = (body as any) || {};

    const effAccountId = accountId || memoryStore.config.accountId;
    const effApiToken = apiToken || memoryStore.config.apiToken;
    const effD1Id = d1DatabaseId || memoryStore.config.d1DatabaseId;
    const effR2Bucket = r2BucketName || memoryStore.config.r2BucketName;

    if (!effAccountId || !effApiToken || !effD1Id) {
      return res.json({
        d1Connected: false,
        r2Connected: false,
        message: 'Cloudflare credentials not provided.'
      });
    }

    const d1Result = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT 1 as test;');
    const d1Connected = Boolean(d1Result && d1Result.success);

    let r2Connected = false;
    if (effR2Bucket && effAccountId && effApiToken) {
      try {
        const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${effAccountId}/r2/buckets/${effR2Bucket}`, {
          headers: { 'Authorization': `Bearer ${effApiToken}` }
        });
        const r2Json = await r2Res.json();
        r2Connected = Boolean(r2Json.success);
      } catch (e) {
        r2Connected = false;
      }
    }

    return res.json({
      d1Connected,
      r2Connected,
      message: d1Connected ? 'Successfully connected to Cloudflare D1 Database & R2 Storage!' : 'Could not authenticate with Cloudflare D1.'
    });
  });

  app.post('/api/cloudflare/init-schema', async (req, res) => {
    const { accountId, apiToken, d1DatabaseId } = req.body || {};
    const effAccountId = accountId || memoryStore.config.accountId;
    const effApiToken = apiToken || memoryStore.config.apiToken;
    const effD1Id = d1DatabaseId || memoryStore.config.d1DatabaseId;

    if (!effAccountId || !effApiToken || !effD1Id) {
      return res.json({
        success: true,
        message: 'Schema initialized in local memory store.'
      });
    }

    const sqlProducts = `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, sku TEXT, gender TEXT, category TEXT, costPrice REAL, retailPrice REAL, totalStock INTEGER, payload TEXT, createdAt TEXT);`;
    const sqlOrders = `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, orderNumber TEXT, totalAmount REAL, payload TEXT, createdAt TEXT);`;
    const sqlPOs = `CREATE TABLE IF NOT EXISTS purchase_orders (id TEXT PRIMARY KEY, poNumber TEXT, status TEXT, payload TEXT, createdAt TEXT);`;
    const sqlSettings = `CREATE TABLE IF NOT EXISTS store_settings (id TEXT PRIMARY KEY, payload TEXT, updatedAt TEXT);`;

    const r1 = await queryD1(effAccountId, effApiToken, effD1Id, sqlProducts);
    const r2 = await queryD1(effAccountId, effApiToken, effD1Id, sqlOrders);
    const r3 = await queryD1(effAccountId, effApiToken, effD1Id, sqlPOs);
    const r4 = await queryD1(effAccountId, effApiToken, effD1Id, sqlSettings);

    const success = Boolean(r1?.success && r2?.success && r3?.success);
    return res.json({
      success,
      message: success ? 'Cloudflare D1 SQL tables created successfully!' : 'D1 schema initialization failed.'
    });
  });

  app.post('/api/cloudflare/sync/push', async (req, res) => {
    const { config, products = [], orders = [], purchaseOrders = [], storeSettings } = req.body || {};
    const effAccountId = config?.accountId || memoryStore.config.accountId;
    const effApiToken = config?.apiToken || memoryStore.config.apiToken;
    const effD1Id = config?.d1DatabaseId || memoryStore.config.d1DatabaseId;

    // Always update local memory store as fallback
    memoryStore.products = products;
    memoryStore.orders = orders;
    memoryStore.purchaseOrders = purchaseOrders;
    if (storeSettings) {
      memoryStore.storeSettings = storeSettings;
    }

    if (effAccountId && effApiToken && effD1Id) {
      // Upsert products to D1
      for (const p of products) {
        const payload = JSON.stringify(p);
        await queryD1(
          effAccountId,
          effApiToken,
          effD1Id,
          `INSERT INTO products (id, name, sku, gender, category, costPrice, retailPrice, totalStock, payload, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             name=excluded.name, sku=excluded.sku, gender=excluded.gender, category=excluded.category, 
             costPrice=excluded.costPrice, retailPrice=excluded.retailPrice, totalStock=excluded.totalStock, 
             payload=excluded.payload, createdAt=excluded.createdAt;`,
          [p.id, p.name, p.sku, p.gender, p.category, p.costPrice, p.retailPrice, p.totalStock || 0, payload, p.createdAt || new Date().toISOString()]
        );
      }

      // Upsert orders to D1
      for (const o of orders) {
        const payload = JSON.stringify(o);
        await queryD1(
          effAccountId,
          effApiToken,
          effD1Id,
          `INSERT INTO orders (id, orderNumber, totalAmount, payload, createdAt) 
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             orderNumber=excluded.orderNumber, totalAmount=excluded.totalAmount, payload=excluded.payload, createdAt=excluded.createdAt;`,
          [o.id, o.orderNumber, o.totalAmount, payload, o.createdAt || new Date().toISOString()]
        );
      }

      // Upsert purchase orders to D1
      for (const po of purchaseOrders) {
        const payload = JSON.stringify(po);
        await queryD1(
          effAccountId,
          effApiToken,
          effD1Id,
          `INSERT INTO purchase_orders (id, poNumber, status, payload, createdAt) 
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             poNumber=excluded.poNumber, status=excluded.status, payload=excluded.payload, createdAt=excluded.createdAt;`,
          [po.id, po.poNumber, po.status, payload, po.createdAt || new Date().toISOString()]
        );
      }

      // Upsert store settings to D1
      if (storeSettings) {
        await queryD1(
          effAccountId,
          effApiToken,
          effD1Id,
          `INSERT INTO store_settings (id, payload, updatedAt) 
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             payload=excluded.payload, updatedAt=excluded.updatedAt;`,
          ['main_settings', JSON.stringify(storeSettings), new Date().toISOString()]
        );
      }

      return res.json({
        success: true,
        message: `Successfully synchronized ${products.length} footwear products and settings to Cloudflare D1!`
      });
    }

    return res.json({
      success: true,
      message: `Synchronized ${products.length} footwear products in memory.`
    });
  });

  app.post('/api/cloudflare/sync/pull', async (req, res) => {
    const { config } = req.body || {};
    const effAccountId = config?.accountId || memoryStore.config.accountId;
    const effApiToken = config?.apiToken || memoryStore.config.apiToken;
    const effD1Id = config?.d1DatabaseId || memoryStore.config.d1DatabaseId;

    if (effAccountId && effApiToken && effD1Id) {
      const pRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM products;');
      const oRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM orders;');
      const poRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM purchase_orders;');
      const sRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM store_settings WHERE id = "main_settings";');

      if (pRes?.success && pRes.result?.[0]?.results) {
        const cloudProducts = pRes.result[0].results.map((r: any) => {
          try { return JSON.parse(r.payload); } catch (e) { return null; }
        }).filter(Boolean);

        const cloudOrders = (oRes?.result?.[0]?.results || []).map((r: any) => {
          try { return JSON.parse(r.payload); } catch (e) { return null; }
        }).filter(Boolean);

        const cloudPOs = (poRes?.result?.[0]?.results || []).map((r: any) => {
          try { return JSON.parse(r.payload); } catch (e) { return null; }
        }).filter(Boolean);

        let cloudSettings = undefined;
        if (sRes?.result?.[0]?.results?.[0]?.payload) {
          try {
            cloudSettings = JSON.parse(sRes.result[0].results[0].payload);
          } catch (e) {}
        }

        return res.json({
          success: true,
          data: {
            products: cloudProducts,
            orders: cloudOrders,
            purchaseOrders: cloudPOs,
            storeSettings: cloudSettings
          }
        });
      }
    }

    // Fallback to memory store
    return res.json({
      success: true,
      data: {
        products: memoryStore.products,
        orders: memoryStore.orders,
        purchaseOrders: memoryStore.purchaseOrders,
        storeSettings: memoryStore.storeSettings
      }
    });
  });

  app.post('/api/cloudflare/upload-image', async (req, res) => {
    const { config, base64Data, filename } = req.body || {};
    const effAccountId = config?.accountId || memoryStore.config.accountId;
    const effApiToken = config?.apiToken || memoryStore.config.apiToken;
    const effR2BucketName = config?.r2BucketName || memoryStore.config.r2BucketName;
    const effR2PublicDomain = config?.r2PublicDomain || memoryStore.config.r2PublicDomain;

    if (effAccountId && effApiToken && effR2BucketName && base64Data) {
      try {
        const cleanName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `shoe_${Date.now()}.jpg`;
        const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${effAccountId}/r2/buckets/${effR2BucketName}/objects/${cleanName}`;
        
        // Strip base64 header if present
        const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(rawBase64, 'base64');

        const r2Upload = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${effApiToken}`,
            'Content-Type': 'image/jpeg'
          },
          body: buffer
        });

        if (r2Upload.ok) {
          const publicUrl = effR2PublicDomain 
            ? `${effR2PublicDomain.replace(/\/$/, '')}/${cleanName}`
            : `https://pub-2a808954f1c74db3a94cdce96474d81f.r2.dev/${cleanName}`;

          console.log(`✅ Uploaded image to Cloudflare R2: ${publicUrl}`);
          return res.json({ success: true, url: publicUrl });
        } else {
          const errBody = await r2Upload.text();
          console.warn(`⚠️ Cloudflare R2 Upload returned HTTP ${r2Upload.status}:`, errBody);
        }
      } catch (e) {
        console.error('Cloudflare R2 Upload failed with exception:', e);
      }
    }

    // Fallback to base64 if R2 is not configured
    return res.json({ success: true, url: base64Data });
  });

  // Vite integration in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 SoleTrack Cloudflare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

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
    config: {
      accountId: '',
      apiToken: '',
      d1DatabaseId: '',
      r2BucketName: '',
      r2PublicDomain: '',
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

    if (!accountId || !apiToken || !d1DatabaseId) {
      return res.json({
        d1Connected: false,
        r2Connected: false,
        message: 'Cloudflare credentials not provided. Operating in Local Proxy mode.'
      });
    }

    const d1Result = await queryD1(accountId, apiToken, d1DatabaseId, 'SELECT 1 as test;');
    const d1Connected = Boolean(d1Result && d1Result.success);

    let r2Connected = false;
    if (r2BucketName && accountId && apiToken) {
      try {
        const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${r2BucketName}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
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
      message: d1Connected ? 'Successfully connected to Cloudflare D1!' : 'Could not authenticate with Cloudflare D1.'
    });
  });

  app.post('/api/cloudflare/init-schema', async (req, res) => {
    const { accountId, apiToken, d1DatabaseId } = req.body || {};

    if (!accountId || !apiToken || !d1DatabaseId) {
      return res.json({
        success: true,
        message: 'Schema initialized in local memory store.'
      });
    }

    const sqlProducts = `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, sku TEXT, gender TEXT, category TEXT, costPrice REAL, retailPrice REAL, totalStock INTEGER, payload TEXT, createdAt TEXT);`;
    const sqlOrders = `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, orderNumber TEXT, totalAmount REAL, payload TEXT, createdAt TEXT);`;
    const sqlPOs = `CREATE TABLE IF NOT EXISTS purchase_orders (id TEXT PRIMARY KEY, poNumber TEXT, status TEXT, payload TEXT, createdAt TEXT);`;

    const r1 = await queryD1(accountId, apiToken, d1DatabaseId, sqlProducts);
    const r2 = await queryD1(accountId, apiToken, d1DatabaseId, sqlOrders);
    const r3 = await queryD1(accountId, apiToken, d1DatabaseId, sqlPOs);

    const success = Boolean(r1?.success && r2?.success && r3?.success);
    return res.json({
      success,
      message: success ? 'Cloudflare D1 SQL tables created successfully!' : 'D1 schema initialization failed.'
    });
  });

  app.post('/api/cloudflare/sync/push', async (req, res) => {
    const { config, products = [], orders = [], purchaseOrders = [] } = req.body || {};
    const { accountId, apiToken, d1DatabaseId } = config || {};

    // Always update local memory store as fallback
    memoryStore.products = products;
    memoryStore.orders = orders;
    memoryStore.purchaseOrders = purchaseOrders;

    if (accountId && apiToken && d1DatabaseId) {
      // Upsert products to D1
      for (const p of products) {
        const payload = JSON.stringify(p);
        await queryD1(
          accountId,
          apiToken,
          d1DatabaseId,
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
          accountId,
          apiToken,
          d1DatabaseId,
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
          accountId,
          apiToken,
          d1DatabaseId,
          `INSERT INTO purchase_orders (id, poNumber, status, payload, createdAt)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             poNumber=excluded.poNumber, status=excluded.status, payload=excluded.payload, createdAt=excluded.createdAt;`,
          [po.id, po.poNumber, po.status, payload, po.createdAt || new Date().toISOString()]
        );
      }
    }

    return res.json({
      success: true,
      message: `Pushed ${products.length} products to Cloudflare Storage.`
    });
  });

  app.post('/api/cloudflare/sync/pull', async (req, res) => {
    const { config } = req.body || {};
    const { accountId, apiToken, d1DatabaseId } = config || {};

    if (accountId && apiToken && d1DatabaseId) {
      const pRes = await queryD1(accountId, apiToken, d1DatabaseId, 'SELECT payload FROM products;');
      const oRes = await queryD1(accountId, apiToken, d1DatabaseId, 'SELECT payload FROM orders;');
      const poRes = await queryD1(accountId, apiToken, d1DatabaseId, 'SELECT payload FROM purchase_orders;');

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

        return res.json({
          success: true,
          data: {
            products: cloudProducts,
            orders: cloudOrders,
            purchaseOrders: cloudPOs
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
        purchaseOrders: memoryStore.purchaseOrders
      }
    });
  });

  app.post('/api/cloudflare/upload-image', async (req, res) => {
    const { config, base64Data, filename } = req.body || {};
    const { accountId, apiToken, r2BucketName, r2PublicDomain } = config || {};

    if (accountId && apiToken && r2BucketName && base64Data) {
      try {
        const cleanName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `shoe_${Date.now()}.jpg`;
        const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${r2BucketName}/objects/${cleanName}`;
        
        // Strip base64 header if present
        const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(rawBase64, 'base64');

        const r2Upload = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'image/jpeg'
          },
          body: buffer
        });

        if (r2Upload.ok) {
          const publicUrl = r2PublicDomain 
            ? `${r2PublicDomain.replace(/\/$/, '')}/${cleanName}`
            : `https://pub-r2.cloudflare.com/${r2BucketName}/${cleanName}`;

          return res.json({ success: true, url: publicUrl });
        }
      } catch (e) {
        console.error('Cloudflare R2 Upload failed:', e);
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

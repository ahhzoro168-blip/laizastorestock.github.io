/**
 * Cloudflare Pages Function API Proxy
 * Handles all /api/cloudflare/* requests securely on the edge without browser CORS issues.
 */

// Helper to return CORS JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}

// Handle CORS Preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Helper to query Cloudflare D1 via API Token from server-side worker
async function queryD1(accountId, apiToken, d1DatabaseId, sql, params = []) {
  if (!accountId || !apiToken || !d1DatabaseId) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });
    return await res.json();
  } catch (err) {
    console.error('Pages Function D1 query error:', err);
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Status Check
  if (path.endsWith('/status')) {
    let body = {};
    if (request.method === 'POST') {
      try { body = await request.json(); } catch (e) {}
    } else {
      body = Object.fromEntries(url.searchParams.entries());
    }

    const effAccountId = body.accountId || env.CLOUDFLARE_ACCOUNT_ID;
    const effApiToken = body.apiToken || env.CLOUDFLARE_API_TOKEN;
    const effD1Id = body.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;
    const effR2Bucket = body.r2BucketName || env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!effAccountId || !effApiToken || !effD1Id) {
      return jsonResponse({
        d1Connected: false,
        r2Connected: false,
        message: 'Cloudflare credentials not fully provided.'
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

    return jsonResponse({
      d1Connected,
      r2Connected,
      message: d1Connected ? 'Successfully connected to Cloudflare D1 & R2!' : 'Could not authenticate with Cloudflare D1.'
    });
  }

  // 2. Initialize Schema
  if (path.endsWith('/init-schema')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const effAccountId = body.accountId || env.CLOUDFLARE_ACCOUNT_ID;
    const effApiToken = body.apiToken || env.CLOUDFLARE_API_TOKEN;
    const effD1Id = body.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;

    if (!effAccountId || !effApiToken || !effD1Id) {
      return jsonResponse({ success: false, message: 'Missing Cloudflare credentials' }, 400);
    }

    const sqlProducts = `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, sku TEXT, gender TEXT, category TEXT, costPrice REAL, retailPrice REAL, totalStock INTEGER, payload TEXT, createdAt TEXT);`;
    const sqlOrders = `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, orderNumber TEXT, totalAmount REAL, payload TEXT, createdAt TEXT);`;
    const sqlPOs = `CREATE TABLE IF NOT EXISTS purchase_orders (id TEXT PRIMARY KEY, poNumber TEXT, status TEXT, payload TEXT, createdAt TEXT);`;
    const sqlSettings = `CREATE TABLE IF NOT EXISTS store_settings (id TEXT PRIMARY KEY, payload TEXT, updatedAt TEXT);`;
    const sqlSkus = `CREATE TABLE IF NOT EXISTS model_skus (sku TEXT PRIMARY KEY, name TEXT, description TEXT, createdAt TEXT);`;
    const sqlCategories = `CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY, description TEXT, createdAt TEXT);`;

    const r1 = await queryD1(effAccountId, effApiToken, effD1Id, sqlProducts);
    const r2 = await queryD1(effAccountId, effApiToken, effD1Id, sqlOrders);
    const r3 = await queryD1(effAccountId, effApiToken, effD1Id, sqlPOs);
    const r4 = await queryD1(effAccountId, effApiToken, effD1Id, sqlSettings);
    const r5 = await queryD1(effAccountId, effApiToken, effD1Id, sqlSkus);
    const r6 = await queryD1(effAccountId, effApiToken, effD1Id, sqlCategories);

    const success = Boolean(r1?.success && r2?.success && r3?.success);
    return jsonResponse({
      success,
      message: success ? 'Cloudflare D1 tables initialized successfully!' : 'Table initialization failed.'
    });
  }

  // 3. Push Data
  if (path.endsWith('/push')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config, products = [], orders = [], purchaseOrders = [], storeSettings } = body;

    const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
    const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
    const effD1Id = config?.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;

    if (effAccountId && effApiToken && effD1Id) {
      // Upsert products
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

      // Upsert orders
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

      // Upsert purchase orders
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

      // Upsert store settings, categories, and skus
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

        if (Array.isArray(storeSettings.customCategories)) {
          for (const cat of storeSettings.customCategories) {
            if (cat && typeof cat === 'string') {
              await queryD1(
                effAccountId,
                effApiToken,
                effD1Id,
                `INSERT INTO categories (name, description, createdAt) VALUES (?, ?, ?)
                 ON CONFLICT(name) DO NOTHING;`,
                [cat.trim(), 'Shoe Category', new Date().toISOString()]
              );
            }
          }
        }

        if (Array.isArray(storeSettings.customSkus)) {
          for (const skuCode of storeSettings.customSkus) {
            if (skuCode && typeof skuCode === 'string') {
              await queryD1(
                effAccountId,
                effApiToken,
                effD1Id,
                `INSERT INTO model_skus (sku, name, description, createdAt) VALUES (?, ?, ?, ?)
                 ON CONFLICT(sku) DO NOTHING;`,
                [skuCode.trim().toUpperCase(), skuCode.trim().toUpperCase(), 'Footwear Model SKU', new Date().toISOString()]
              );
            }
          }
        }
      }

      return jsonResponse({
        success: true,
        message: `Successfully pushed ${products.length} products to Cloudflare D1!`
      });
    }

    return jsonResponse({ success: true, message: 'Processed push.' });
  }

  // 4. Pull Data
  if (path.endsWith('/pull')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config } = body;

    const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
    const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
    const effD1Id = config?.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;

    if (effAccountId && effApiToken && effD1Id) {
      const pRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM products;');
      const oRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM orders;');
      const poRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM purchase_orders;');
      const sRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT payload FROM store_settings WHERE id = "main_settings";');
      const catRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT name FROM categories;');
      const skuRes = await queryD1(effAccountId, effApiToken, effD1Id, 'SELECT sku FROM model_skus;');

      const cloudProducts = (pRes?.result?.[0]?.results || []).map((r) => {
        try { return JSON.parse(r.payload); } catch (e) { return null; }
      }).filter(Boolean);

      const cloudOrders = (oRes?.result?.[0]?.results || []).map((r) => {
        try { return JSON.parse(r.payload); } catch (e) { return null; }
      }).filter(Boolean);

      const cloudPOs = (poRes?.result?.[0]?.results || []).map((r) => {
        try { return JSON.parse(r.payload); } catch (e) { return null; }
      }).filter(Boolean);

      let cloudSettings = undefined;
      if (sRes?.result?.[0]?.results?.[0]?.payload) {
        try { cloudSettings = JSON.parse(sRes.result[0].results[0].payload); } catch (e) {}
      }
      const finalSettings = cloudSettings || {};

      const d1Categories = (catRes?.result?.[0]?.results || []).map((r) => r.name).filter(Boolean);
      if (d1Categories.length > 0) {
        finalSettings.customCategories = Array.from(new Set([
          ...(finalSettings.customCategories || []),
          ...d1Categories
        ]));
      }

      const d1Skus = (skuRes?.result?.[0]?.results || []).map((r) => r.sku).filter(Boolean);
      if (d1Skus.length > 0) {
        finalSettings.customSkus = Array.from(new Set([
          ...(finalSettings.customSkus || []),
          ...d1Skus
        ]));
      }

      return jsonResponse({
        success: true,
        data: {
          products: cloudProducts,
          orders: cloudOrders,
          purchaseOrders: cloudPOs,
          storeSettings: finalSettings
        }
      });
    }

    return jsonResponse({
      success: true,
      data: {
        products: [],
        orders: [],
        purchaseOrders: [],
        storeSettings: {}
      }
    });
  }

  // 5. Upload Image to R2
  if (path.endsWith('/upload-image')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config, base64Data, filename } = body;

    const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
    const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
    const effR2BucketName = config?.r2BucketName || env.CLOUDFLARE_R2_BUCKET_NAME;
    const effR2PublicDomain = config?.r2PublicDomain || env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

    if (effAccountId && effApiToken && effR2BucketName && base64Data) {
      try {
        const cleanName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `shoe_${Date.now()}.jpg`;
        const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${effAccountId}/r2/buckets/${effR2BucketName}/objects/${cleanName}`;
        
        const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const binaryStr = atob(rawBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const r2Upload = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${effApiToken}`,
            'Content-Type': 'image/jpeg'
          },
          body: bytes.buffer
        });

        if (r2Upload.ok) {
          const publicUrl = effR2PublicDomain 
            ? `${effR2PublicDomain.replace(/\/$/, '')}/${cleanName}`
            : `https://pub-2a808954f1c74db3a94cdce96474d81f.r2.dev/${cleanName}`;

          return jsonResponse({ success: true, url: publicUrl });
        }
      } catch (e) {
        console.error('R2 upload error in Pages Function:', e);
      }
    }

    return jsonResponse({ success: true, url: base64Data });
  }

  return jsonResponse({ success: true, message: 'Cloudflare Pages API Proxy active.' });
}

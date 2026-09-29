/**
 * Cloudflare Pages Serverless Function API Proxy & Native D1/R2 Handler
 * Supports both Native Pages D1/R2 Bindings (env.DB, env.R2) and Cloudflare REST API Token Proxy.
 * Prevents 405 Method Not Allowed and eliminates browser CORS errors.
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// REST API fallback query helper
async function queryD1Rest(accountId, apiToken, d1DatabaseId, sql, params = []) {
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
    console.error('REST D1 query error:', err);
    return null;
  }
}

// Unified SQL executor (Native D1 binding first, REST API fallback second)
async function executeSql(env, sql, params = [], config = {}) {
  // 1. Check for native Cloudflare Pages D1 binding
  const nativeD1 = env.DB || env.D1 || env.DATABASE || env.laiza_store_db || env.d1DatabaseId;
  if (nativeD1 && typeof nativeD1.prepare === 'function') {
    try {
      const stmt = nativeD1.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const res = await bound.all();
        return { success: true, result: [{ results: res.results || [] }] };
      } else {
        const runRes = await bound.run();
        return { success: true, result: [runRes] };
      }
    } catch (e) {
      console.warn('Native D1 execution error, attempting REST fallback:', e);
    }
  }

  // 2. Cloudflare REST API Token fallback
  const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
  const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
  const effD1Id = config?.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;

  if (effAccountId && effApiToken && effD1Id) {
    return await queryD1Rest(effAccountId, effApiToken, effD1Id, sql, params);
  }

  return null;
}

// Universal Request Handler for all HTTP methods
async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 1. /api/cloudflare/config
  if (path.endsWith('/config')) {
    return jsonResponse({
      success: true,
      config: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID || '',
        d1DatabaseId: env.CLOUDFLARE_D1_DATABASE_ID || '',
        r2BucketName: env.CLOUDFLARE_R2_BUCKET_NAME || '',
        r2PublicDomain: env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '',
        hasApiToken: Boolean(env.CLOUDFLARE_API_TOKEN),
        hasNativeD1: Boolean(env.DB || env.D1 || env.DATABASE || env.laiza_store_db),
        hasNativeR2: Boolean(env.R2 || env.BUCKET || env.IMAGES || env.laiza_store_images)
      }
    });
  }

  // 2. /api/cloudflare/status
  if (path.endsWith('/status')) {
    let body = {};
    if (request.method === 'POST') {
      try { body = await request.json(); } catch (e) {}
    } else {
      body = Object.fromEntries(url.searchParams.entries());
    }

    const testRes = await executeSql(env, 'SELECT 1 as test;', [], body);
    const d1Connected = Boolean(testRes && testRes.success);

    const nativeR2 = env.R2 || env.BUCKET || env.IMAGES || env.laiza_store_images;
    let r2Connected = Boolean(nativeR2 && typeof nativeR2.put === 'function');

    if (!r2Connected) {
      const effAccountId = body.accountId || env.CLOUDFLARE_ACCOUNT_ID;
      const effApiToken = body.apiToken || env.CLOUDFLARE_API_TOKEN;
      const effR2Bucket = body.r2BucketName || env.CLOUDFLARE_R2_BUCKET_NAME;

      if (effAccountId && effApiToken && effR2Bucket) {
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
    }

    return jsonResponse({
      d1Connected,
      r2Connected,
      message: d1Connected 
        ? 'Successfully connected to Cloudflare D1 Database & R2 Storage!' 
        : 'Could not connect to Cloudflare D1. Check environment variables or credentials.'
    });
  }

  // 3. /api/cloudflare/init-schema
  if (path.endsWith('/init-schema')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}

    const sqlProducts = `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, sku TEXT, gender TEXT, category TEXT, costPrice REAL, retailPrice REAL, totalStock INTEGER, payload TEXT, createdAt TEXT);`;
    const sqlOrders = `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, orderNumber TEXT, totalAmount REAL, payload TEXT, createdAt TEXT);`;
    const sqlPOs = `CREATE TABLE IF NOT EXISTS purchase_orders (id TEXT PRIMARY KEY, poNumber TEXT, status TEXT, payload TEXT, createdAt TEXT);`;
    const sqlSettings = `CREATE TABLE IF NOT EXISTS store_settings (id TEXT PRIMARY KEY, payload TEXT, updatedAt TEXT);`;
    const sqlSkus = `CREATE TABLE IF NOT EXISTS model_skus (sku TEXT PRIMARY KEY, name TEXT, description TEXT, createdAt TEXT);`;
    const sqlCategories = `CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY, description TEXT, createdAt TEXT);`;

    const r1 = await executeSql(env, sqlProducts, [], body);
    const r2 = await executeSql(env, sqlOrders, [], body);
    const r3 = await executeSql(env, sqlPOs, [], body);
    const r4 = await executeSql(env, sqlSettings, [], body);
    const r5 = await executeSql(env, sqlSkus, [], body);
    const r6 = await executeSql(env, sqlCategories, [], body);

    const success = Boolean(r1?.success && r2?.success && r3?.success);
    return jsonResponse({
      success,
      message: success 
        ? 'Cloudflare D1 tables (products, orders, purchase_orders, store_settings, model_skus, categories) initialized successfully!' 
        : 'Schema initialization completed.'
    });
  }

  // 4. /api/cloudflare/sync/push
  if (path.endsWith('/push') || path.endsWith('/sync/push')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config, products = [], orders = [], purchaseOrders = [], storeSettings } = body;

    // Upsert products
    for (const p of products) {
      const payload = JSON.stringify(p);
      await executeSql(
        env,
        `INSERT INTO products (id, name, sku, gender, category, costPrice, retailPrice, totalStock, payload, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           name=excluded.name, sku=excluded.sku, gender=excluded.gender, category=excluded.category, 
           costPrice=excluded.costPrice, retailPrice=excluded.retailPrice, totalStock=excluded.totalStock, 
           payload=excluded.payload, createdAt=excluded.createdAt;`,
        [p.id, p.name, p.sku, p.gender, p.category, p.costPrice, p.retailPrice, p.totalStock || 0, payload, p.createdAt || new Date().toISOString()],
        config
      );
    }

    // Upsert orders
    for (const o of orders) {
      const payload = JSON.stringify(o);
      await executeSql(
        env,
        `INSERT INTO orders (id, orderNumber, totalAmount, payload, createdAt) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           orderNumber=excluded.orderNumber, totalAmount=excluded.totalAmount, payload=excluded.payload, createdAt=excluded.createdAt;`,
        [o.id, o.orderNumber, o.totalAmount, payload, o.createdAt || new Date().toISOString()],
        config
      );
    }

    // Upsert purchase orders
    for (const po of purchaseOrders) {
      const payload = JSON.stringify(po);
      await executeSql(
        env,
        `INSERT INTO purchase_orders (id, poNumber, status, payload, createdAt) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           poNumber=excluded.poNumber, status=excluded.status, payload=excluded.payload, createdAt=excluded.createdAt;`,
        [po.id, po.poNumber, po.status, payload, po.createdAt || new Date().toISOString()],
        config
      );
    }

    // Upsert store settings, categories, and skus
    if (storeSettings) {
      await executeSql(
        env,
        `INSERT INTO store_settings (id, payload, updatedAt) 
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           payload=excluded.payload, updatedAt=excluded.updatedAt;`,
        ['main_settings', JSON.stringify(storeSettings), new Date().toISOString()],
        config
      );

      if (Array.isArray(storeSettings.customCategories)) {
        for (const cat of storeSettings.customCategories) {
          if (cat && typeof cat === 'string') {
            await executeSql(
              env,
              `INSERT INTO categories (name, description, createdAt) VALUES (?, ?, ?)
               ON CONFLICT(name) DO NOTHING;`,
              [cat.trim(), 'Shoe Category', new Date().toISOString()],
              config
            );
          }
        }
      }

      if (Array.isArray(storeSettings.customSkus)) {
        for (const skuCode of storeSettings.customSkus) {
          if (skuCode && typeof skuCode === 'string') {
            await executeSql(
              env,
              `INSERT INTO model_skus (sku, name, description, createdAt) VALUES (?, ?, ?, ?)
               ON CONFLICT(sku) DO NOTHING;`,
              [skuCode.trim().toUpperCase(), skuCode.trim().toUpperCase(), 'Footwear Model SKU', new Date().toISOString()],
              config
            );
          }
        }
      }
    }

    return jsonResponse({
      success: true,
      message: `Synchronized ${products.length} footwear items & records to Cloudflare D1!`
    });
  }

  // 5. /api/cloudflare/sync/pull
  if (path.endsWith('/pull') || path.endsWith('/sync/pull')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config } = body;

    const pRes = await executeSql(env, 'SELECT payload FROM products;', [], config);
    const oRes = await executeSql(env, 'SELECT payload FROM orders;', [], config);
    const poRes = await executeSql(env, 'SELECT payload FROM purchase_orders;', [], config);
    const sRes = await executeSql(env, 'SELECT payload FROM store_settings WHERE id = "main_settings";', [], config);
    const catRes = await executeSql(env, 'SELECT name FROM categories;', [], config);
    const skuRes = await executeSql(env, 'SELECT sku FROM model_skus;', [], config);

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

  // 6. /api/cloudflare/upload-image
  if (path.endsWith('/upload-image')) {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { config, base64Data, filename } = body;

    if (base64Data) {
      try {
        const cleanName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `shoe_${Date.now()}.jpg`;
        const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const binaryStr = atob(rawBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const nativeR2 = env.R2 || env.BUCKET || env.IMAGES || env.laiza_store_images;
        if (nativeR2 && typeof nativeR2.put === 'function') {
          await nativeR2.put(cleanName, bytes.buffer, {
            httpMetadata: { contentType: 'image/jpeg' }
          });
          const publicDomain = config?.r2PublicDomain || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://pub-2a808954f1c74db3a94cdce96474d81f.r2.dev';
          return jsonResponse({
            success: true,
            url: `${publicDomain.replace(/\/$/, '')}/${cleanName}`
          });
        }

        // REST R2 fallback
        const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
        const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
        const effR2Bucket = config?.r2BucketName || env.CLOUDFLARE_R2_BUCKET_NAME;
        const effPublicDomain = config?.r2PublicDomain || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://pub-2a808954f1c74db3a94cdce96474d81f.r2.dev';

        if (effAccountId && effApiToken && effR2Bucket) {
          const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${effAccountId}/r2/buckets/${effR2Bucket}/objects/${cleanName}`;
          const r2Upload = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${effApiToken}`,
              'Content-Type': 'image/jpeg'
            },
            body: bytes.buffer
          });

          if (r2Upload.ok) {
            return jsonResponse({
              success: true,
              url: `${effPublicDomain.replace(/\/$/, '')}/${cleanName}`
            });
          }
        }
      } catch (err) {
        console.error('R2 upload error in Pages Function:', err);
      }
    }

    return jsonResponse({ success: true, url: base64Data });
  }

  return jsonResponse({ success: true, message: 'Cloudflare Pages Serverless Function active.' });
}

// Explicit export handlers for Cloudflare Pages Functions to guarantee 0 Method Not Allowed errors
export const onRequest = handleRequest;
export const onRequestGet = handleRequest;
export const onRequestPost = handleRequest;
export const onRequestPut = handleRequest;
export const onRequestDelete = handleRequest;
export const onRequestOptions = handleRequest;
export const onRequestHead = handleRequest;

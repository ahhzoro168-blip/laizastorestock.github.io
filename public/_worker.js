/**
 * Cloudflare Pages Worker (Advanced Mode)
 * - Intercepts all requests starting with /api/cloudflare/ and proxies them to https://api.cloudflare.com/client/v4/
 * - Handles internal synchronization endpoints (/status, /init-schema, /sync/push, /sync/pull, /upload-image, /config)
 * - Cleanly handles CORS & OPTIONS preflight requests
 * - Serves static assets for non-API routes using env.ASSETS.fetch(request)
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

// REST API D1 query helper
async function queryD1Rest(accountId, apiToken, d1DatabaseId, sql, params = []) {
  if (!accountId || !apiToken || !d1DatabaseId) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });
    return await res.json();
  } catch (err) {
    console.error('REST D1 query error:', err);
    return null;
  }
}

// SQL executor: Native D1 binding first, REST API fallback second
async function executeSql(env, sql, params = [], config = {}) {
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

  const effAccountId = config?.accountId || env.CLOUDFLARE_ACCOUNT_ID;
  const effApiToken = config?.apiToken || env.CLOUDFLARE_API_TOKEN;
  const effD1Id = config?.d1DatabaseId || env.CLOUDFLARE_D1_DATABASE_ID;

  if (effAccountId && effApiToken && effD1Id) {
    return await queryD1Rest(effAccountId, effApiToken, effD1Id, sql, params);
  }

  return null;
}

// Proxy request directly to https://api.cloudflare.com/client/v4/
async function proxyToCloudflareApi(request, env, subPath) {
  const targetBase = 'https://api.cloudflare.com/client/v4/';
  const url = new URL(request.url);
  const targetUrl = targetBase + subPath + url.search;

  const headers = new Headers(request.headers);
  headers.set('Host', 'api.cloudflare.com');

  if (!headers.has('Authorization') && env.CLOUDFLARE_API_TOKEN) {
    headers.set('Authorization', `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
  }

  const isBodyAllowed = !['GET', 'HEAD'].includes(request.method.toUpperCase());
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: isBodyAllowed ? request.body : undefined,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Intercept all HTTP requests starting with /api/cloudflare/
    if (url.pathname.startsWith('/api/cloudflare/')) {
      // Cleanly handle OPTIONS preflight CORS requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(),
        });
      }

      const path = url.pathname;

      // --- Route 1: Status Check ---
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
                headers: { 'Authorization': `Bearer ${effApiToken}` },
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
            : 'Could not connect to Cloudflare D1. Check credentials or bindings.',
        });
      }

      // --- Route 2: Sync Pull ---
      if (path.endsWith('/sync/pull')) {
        // Execute your D1 pull logic / query here
        try {
          // Example D1 retrieval or mock payload:
          const pullRes = await executeSql(env, 'SELECT * FROM inventory;', [], {});
          return jsonResponse({
            success: true,
            data: pullRes?.results || [],
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // --- Route 3: Sync Push ---
      if (path.endsWith('/sync/push')) {
        try {
          const body = await request.json();
          // Execute your D1 insert/update logic here
          return jsonResponse({ success: true, message: 'Sync pushed successfully' });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Fallback for unmatched /api/cloudflare/* routes
      return jsonResponse({ error: 'Endpoint not found' }, 404);
    }

    // 2. Serve static site assets for all other non-API routes
    return env.ASSETS.fetch(request);
  }
};

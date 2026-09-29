export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Forward request to Cloudflare D1 / R2 REST API
  const cloudflareApiPath = url.pathname.replace('/api/cloudflare', '');
  const targetUrl = `https://api.cloudflare.com/client/v4${cloudflareApiPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set("Host", "api.cloudflare.com");

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
  });

  try {
    const response = await fetch(modifiedRequest);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

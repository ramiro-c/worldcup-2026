/**
 * Cloudflare Workers entry point.
 *
 * Proxies /api/*, /historical/*, and /health requests to the Render API backend.
 * Serves static assets (React SPA) for everything else.
 */

const API_ORIGIN = "https://worldcup-2026.onrender.com";

export default {
  async fetch(request: Request, env: { ASSETS?: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/") || path.startsWith("/historical/") || path === "/health") {
      const apiUrl = `${API_ORIGIN}${path}${url.search}`;
      const headers = new Headers(request.headers);
      headers.set("Host", new URL(API_ORIGIN).host);

      const response = await fetch(apiUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      });

      const respHeaders = new Headers(response.headers);
      respHeaders.set("Access-Control-Allow-Origin", "*");
      respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      respHeaders.set("Access-Control-Allow-Headers", "Content-Type");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: respHeaders,
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};

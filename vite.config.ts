import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/** Proxy de dev para contornar CORS no navegador: encaminha requisições para a URL em X-Proxy-URL. */
function devProxyPlugin() {
  const PROXY_PATH = "/__dev-proxy";
  return {
    name: "dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith(PROXY_PATH) !== true) return next();
        const targetUrl = req.headers["x-proxy-url"];
        if (!targetUrl || typeof targetUrl !== "string") {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain");
          res.end("Header X-Proxy-URL obrigatório");
          return;
        }
        try {
          const body = req.method !== "GET" && req.method !== "HEAD" ? await readBody(req) : undefined;
          const headers = { ...req.headers } as Record<string, string>;
          delete headers["x-proxy-url"];
          delete headers["host"];
          const proxyRes = await fetch(targetUrl, {
            method: req.method || "GET",
            headers,
            body: body as BodyInit | undefined,
          });
          res.statusCode = proxyRes.status;
          res.statusMessage = proxyRes.statusText;
          const text = await proxyRes.text();
          proxyRes.headers.forEach((v, k) => {
            const key = k.toLowerCase();
            if (key !== "content-encoding" && key !== "transfer-encoding") res.setHeader(key, v);
          });
          res.setHeader("Content-Length", Buffer.byteLength(text, "utf8"));
          res.end(text);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "text/plain");
          res.end(`Proxy error: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    },
  };
}

function readBody(req: import("http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default defineConfig({
  plugins: [react(), devProxyPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
});

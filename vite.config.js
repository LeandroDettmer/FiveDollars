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
          const headers = { ...req.headers };
          delete headers["x-proxy-url"];
          delete headers["host"];
          const proxyRes = await fetch(targetUrl, {
            method: req.method || "GET",
            headers,
            body,
          });
          console.log(proxyRes);
          res.statusCode = proxyRes.status;
          res.statusMessage = proxyRes.statusText;
          proxyRes.headers.forEach((v, k) => res.setHeader(k, v));
          const text = await proxyRes.text();
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
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

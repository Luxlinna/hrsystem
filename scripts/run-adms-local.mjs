import { createServer, request as httpRequest } from "node:http";

const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 4000;
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";

function makeProxyServer(port) {
  const server = createServer((req, res) => {
    console.log(`[Local ADMS Proxy :${port}] Incoming ${req.method} ${req.url} -> Forwarding to backend :${BACKEND_PORT}`);

    const proxyReq = httpRequest(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `${BACKEND_HOST}:${BACKEND_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[Local ADMS Proxy]", port, "Backend connection error:", err.message);
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("502 Bad Gateway");
    });

    req.pipe(proxyReq);
  });

  server.on("error", (err) => {
    console.warn("[Local ADMS] Could not listen on port:", port, err.message);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log("[Local ADMS Proxy] listening on port:", port, "forwarding to backend:", BACKEND_PORT);
  });

  return server;
}

makeProxyServer(80);
makeProxyServer(8080);

console.log("📡 Ready for punches on both port 80 and port 8080!");

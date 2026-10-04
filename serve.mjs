import { createServer, request as httpRequest } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fork } from "node:child_process";
import { extname, join, normalize } from "node:path";
import dotenv from "dotenv";
dotenv.config();

const ROOT = join(import.meta.dirname, "out");
const PORT = Number(process.env.PORT) || 3000;
const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 4000;
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";

// --- Backend Process Supervisor ---
let backendChild = null;

function startBackendServer() {
  const distPath = join(import.meta.dirname, "server", "dist", "server.js");
  if (!existsSync(distPath)) {
    console.warn(`[Supervisor] Backend build not found at ${distPath}. Running in proxy-only mode.`);
    return;
  }

  console.log(`[Supervisor] Starting backend server from ${distPath}...`);
  backendChild = fork(distPath, [], {
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: "inherit",
  });

  backendChild.on("exit", (code, signal) => {
    console.warn(`[Supervisor] Backend process exited (code=${code}, signal=${signal}).`);
    backendChild = null;
  });

  backendChild.on("error", (err) => {
    console.error("[Supervisor] Backend child process error:", err);
  });
}

function stopBackendServer() {
  if (backendChild) {
    backendChild.kill("SIGTERM");
    backendChild = null;
  }
}

process.on("exit", stopBackendServer);
process.on("SIGINT", () => { stopBackendServer(); process.exit(0); });
process.on("SIGTERM", () => { stopBackendServer(); process.exit(0); });

// --- In-Memory Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 200;
const ipRequestHistory = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const history = (ipRequestHistory.get(ip) || []).filter((t) => t > cutoff);
  if (history.length >= MAX_REQUESTS_PER_WINDOW) return true;
  history.push(now);
  ipRequestHistory.set(ip, history);
  return false;
}

setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, history] of ipRequestHistory.entries()) {
    const valid = history.filter((t) => t > cutoff);
    if (!valid.length) ipRequestHistory.delete(ip);
    else ipRequestHistory.set(ip, valid);
  }
}, 5 * 60 * 1000);

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = String(forwarded).split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers["x-real-ip"] || req.socket.remoteAddress || "unknown";
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

async function resolveFile(urlPath) {
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) return null;
  try {
    const s = await stat(filePath);
    if (s.isFile()) return filePath;
  } catch {
    // fall through
  }
  return null;
}

function proxyToBackend(req, res) {
  const proxyReq = httpRequest(
    {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        "x-forwarded-for": getRequestIp(req),
        host: `${BACKEND_HOST}:${BACKEND_PORT}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error("[Proxy] Error forwarding request to backend:", req.method, req.url, err.message);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("502 Bad Gateway: Backend server unavailable");
  });

  req.pipe(proxyReq);
}

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const MAX_PAYLOAD_BYTES = 15 * 1024 * 1024;
const SUSPICIOUS_PATH = /(\/\.\.|\.\.\/|%2e%2e|\0|%00|\.(env|git|svn|htaccess|php|asp|aspx|jsp|sh|bak|config)($|[/?#]))/i;

function detectBadRequest(req, res) {
  if (!ALLOWED_METHODS.has(req.method)) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("405 Method Not Allowed");
    return true;
  }
  const rawUrl = req.url || "";
  if (!rawUrl || SUSPICIOUS_PATH.test(rawUrl)) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("400 Bad Request: Invalid or suspicious request path.");
    return true;
  }
  const len = Number(req.headers["content-length"]);
  if (!isNaN(len) && len > MAX_PAYLOAD_BYTES) {
    res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("413 Payload Too Large.");
    return true;
  }
  return false;
}

const server = createServer(async (req, res) => {
  try {
    if (detectBadRequest(req, res)) return;

    const clientIp = getRequestIp(req);
    const isHardwareOrApi = req.url.startsWith("/iclock") || req.url.startsWith("/api");

    if (!isHardwareOrApi && isRateLimited(clientIp)) {
      res.writeHead(429, { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" });
      res.end("429 Too Many Requests: Rate limit exceeded.");
      return;
    }

    if (isHardwareOrApi) {
      proxyToBackend(req, res);
      return;
    }

    const host = req.headers.host || "localhost";
    let url;
    try {
      url = new URL(req.url, `http://${host}`);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("400 Bad Request: Malformed URL.");
      return;
    }

    let requested;
    try {
      requested = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("400 Bad Request: URI decoding failed.");
      return;
    }

    const filePath = (await resolveFile(requested)) || join(ROOT, "index.html");
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error: " + err.message);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Frontend SPA Server] Serving ${ROOT} on http://0.0.0.0:${PORT}`);
  console.log(`[Proxy] Forwarding /api/* and /iclock/* to Backend at http://${BACKEND_HOST}:${BACKEND_PORT}`);
  startBackendServer();
});

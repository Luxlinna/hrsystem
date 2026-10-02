import { createServer, request as httpRequest } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import dotenv from "dotenv";
dotenv.config();

const ROOT = join(import.meta.dirname, "out");
const PORT = Number(process.env.PORT) || 3000;
const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 4000;
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";

// --- In-Memory Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 200; // Max 200 requests/min per IP
const ipRequestHistory = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const history = (ipRequestHistory.get(ip) || []).filter((time) => time > cutoff);

  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  history.push(now);
  ipRequestHistory.set(ip, history);
  return false;
}

// Clean up stale IPs every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [ip, history] of ipRequestHistory.entries()) {
    const valid = history.filter((time) => time > cutoff);
    if (valid.length === 0) {
      ipRequestHistory.delete(ip);
    } else {
      ipRequestHistory.set(ip, valid);
    }
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

// --- Proxy Helper for Backend API & Hardware Requests ---
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
    console.error(`[Proxy] Error forwarding ${req.method} ${req.url} to backend:`, err.message);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("502 Bad Gateway: Backend server unavailable");
  });

  req.pipe(proxyReq);
}

// --- Bad Request Detection Middleware ---
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const MAX_PAYLOAD_BYTES = 15 * 1024 * 1024; // 15MB limit for device batch logs
const SUSPICIOUS_PATH_PATTERN = /(\/\.\.|\.\.\/|%2e%2e|\0|%00|\.(env|git|svn|htaccess|php|asp|aspx|jsp|sh|bak|config)($|[/?#]))/i;

function detectBadRequest(req, res) {
  // 1. Method check
  if (!ALLOWED_METHODS.has(req.method)) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("405 Method Not Allowed");
    return true;
  }

  // 2. URL sanity & null bytes / path traversal / exploit probing
  const rawUrl = req.url || "";
  if (!rawUrl || SUSPICIOUS_PATH_PATTERN.test(rawUrl)) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("400 Bad Request: Invalid or suspicious request path.");
    return true;
  }

  // 3. Payload size check
  const contentLengthHeader = req.headers["content-length"];
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (isNaN(contentLength) || contentLength < 0) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("400 Bad Request: Invalid Content-Length header.");
      return true;
    }
    if (contentLength > MAX_PAYLOAD_BYTES) {
      res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("413 Payload Too Large: Request exceeds maximum size limit.");
      return true;
    }
  }

  return false;
}

const server = createServer(async (req, res) => {
  try {
    // 1. Detect bad / suspicious requests early
    if (detectBadRequest(req, res)) {
      return;
    }

    // 2. Rate limiting check (bypass for hardware push /iclock)
    const clientIp = getRequestIp(req);
    const isHardwareOrApi = req.url.startsWith("/iclock") || req.url.startsWith("/api");

    if (!isHardwareOrApi && isRateLimited(clientIp)) {
      res.writeHead(429, {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
      });
      res.end("429 Too Many Requests: Rate limit exceeded. Please retry in 60 seconds.");
      return;
    }

    // 3. Proxy Hardware & API routes to Express Backend
    if (isHardwareOrApi) {
      proxyToBackend(req, res);
      return;
    }

    // 4. Safe URL parsing & decoding for SPA static assets
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
});

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import dotenv from "dotenv";
dotenv.config();
import { handleZkAdmsRequest, checkBiometricDeviceHealth } from "./zkteco-adms-handler.mjs";

const ROOT = join(import.meta.dirname, "out");
const PORT = Number(process.env.PORT) || 3000;

// Biometric Device Health & Telegram Offline Watchdog (Runs every 5 minutes)
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;
setInterval(checkBiometricDeviceHealth, WATCHDOG_INTERVAL_MS);
setTimeout(checkBiometricDeviceHealth, 10000);

// --- In-Memory Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 200; // Max 200 requests/min per IP (ample for loading SPA assets)
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

// --- Bad Request Detection Middleware ---
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
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

    // 2. Rate limiting check
    const clientIp = getRequestIp(req);
    if (isRateLimited(clientIp)) {
      res.writeHead(429, {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
      });
      res.end("429 Too Many Requests: Rate limit exceeded. Please retry in 60 seconds.");
      return;
    }

    // 3. Biometric device handler
    const isAdms = await handleZkAdmsRequest(req, res);
    if (isAdms) return;

    // 4. Safe URL parsing & decoding
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
  console.log(`Serving ${ROOT} on http://0.0.0.0:${PORT}`);
});

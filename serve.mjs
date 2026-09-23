import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
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

const server = createServer(async (req, res) => {
  try {
    const clientIp = getRequestIp(req);
    if (isRateLimited(clientIp)) {
      res.writeHead(429, {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
      });
      res.end("429 Too Many Requests: Rate limit exceeded. Please retry in 60 seconds.");
      return;
    }

    const isAdms = await handleZkAdmsRequest(req, res);
    if (isAdms) return;

    const url = new URL(req.url, `http://${req.headers.host}`);
    const requested = decodeURIComponent(url.pathname);
    const filePath = (await resolveFile(requested)) || join(ROOT, "index.html");
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error: " + err.message);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serving ${ROOT} on http://0.0.0.0:${PORT}`);
});

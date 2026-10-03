import cors, { CorsOptions } from 'cors';
import { env } from '../../config/env.js';

/**
 * 🌐 1. Static Production & Development URLs
 * These origins are always whitelisted by default.
 */
const STATIC_ALLOWED_ORIGINS: string[] = [
  'https://hrsystem.opssolution.tech',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * ⚙️ 2. Dynamic Origins from Environment Variables (.env)
 * Resolves env.FRONTEND_URL and env.CORS_ORIGIN
 */
function getAllowedOrigins(): string[] | boolean {
  // If explicitly set to '*' allow all (useful for dev)
  if (env.CORS_ORIGIN === '*') {
    return true;
  }

  const origins = new Set<string>(
    STATIC_ALLOWED_ORIGINS.map((url) => url.replace(/\/$/, ''))
  );

  // Read FRONTEND_URL / VITE_APP_URL from env.ts
  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(',').forEach((url) => {
      const trimmed = url.trim().replace(/\/$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  // Read CORS_ORIGIN from env.ts
  if (env.CORS_ORIGIN) {
    env.CORS_ORIGIN.split(',').forEach((url) => {
      const trimmed = url.trim().replace(/\/$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  return Array.from(origins);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();

    // Allow non-browser clients (cURL, Postman, server-to-server, ADMS terminals)
    if (!origin || allowed === true) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (Array.isArray(allowed)) {
      const isAllowed = allowed.some((allowedUrl) => {
        // Direct domain match
        if (allowedUrl === normalizedOrigin) return true;

        // Wildcard subdomain match (e.g. *.opssolution.tech)
        if (allowedUrl.startsWith('*.')) {
          const rootDomain = allowedUrl.slice(2);
          return normalizedOrigin.endsWith(rootDomain);
        }
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }
    }

    return callback(new Error(`CORS blocked: Origin "${origin}" is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'Accept',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
    'X-Cache',
  ],
  maxAge: 86400, // Cache preflight OPTIONS responses for 24h
};

export const corsSecurity = cors(corsOptions);

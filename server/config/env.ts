import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

// .env.local takes priority (dev overrides), then .env as fallback.
// dotenv will NOT overwrite vars already set by the first call.
dotenv.config({ path: path.join(serverRoot, '.env.local') });
dotenv.config({ path: path.join(serverRoot, '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  /** Identifies which Supabase project the server is pointing at (derived from DATABASE_URL). */
  DB_TARGET: (process.env.DATABASE_URL || '').includes('mltkqbcjavgfclitgvin')
    ? 'TEST'
    : (process.env.DATABASE_URL || '').includes('jnrozihprpjvnofjlbtd')
      ? 'PRODUCTION'
      : 'UNKNOWN',
  SUPABASE_URL:
    process.env.SUPABASE_URL ||
    process.env.VITE_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.CLIENT_URL || process.env.APP_URL || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_TLS: process.env.REDIS_TLS === 'true',
};

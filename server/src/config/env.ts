import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://jnrozihprpjvnofjlbtd.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

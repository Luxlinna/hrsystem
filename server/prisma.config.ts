import dotenv from 'dotenv';

dotenv.config();

export const prismaConfig = {
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  logLevel: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
};

export default prismaConfig;

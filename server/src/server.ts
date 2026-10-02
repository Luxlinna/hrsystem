import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { prisma } from './core/infrastructure/database/prisma.client.js';

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[HRMS Backend Server] running on http://localhost:${PORT}`);
  console.log(`[Health check] http://localhost:${PORT}/api/v1/health`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Closing server gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { prisma } from './core/infrastructure/database/prisma.client.js';
import { biometricService } from './modules/biometrics/zkteco.service.js';

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[HRMS Backend Server] running on http://localhost:${PORT}`);
  console.log(`[Health check] http://localhost:${PORT}/api/v1/health`);
  console.log(`[ZKTeco ADMS Endpoint] http://localhost:${PORT}/iclock/cdata`);
});

// Biometric Device Offline Watchdog (Runs every 5 minutes)
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;
const watchdogInterval = setInterval(() => {
  biometricService.checkBiometricDeviceHealth().catch((err) => {
    console.error('[ZKTeco Watchdog] Error in scheduled run:', err);
  });
}, WATCHDOG_INTERVAL_MS);

// Initial health check after 10s boot
setTimeout(() => {
  biometricService.checkBiometricDeviceHealth().catch((err) => {
    console.error('[ZKTeco Watchdog] Error in initial run:', err);
  });
}, 10000);

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Closing server gracefully...`);
  clearInterval(watchdogInterval);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

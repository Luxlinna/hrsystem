import { createApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { biometricService } from './services/biometric.service.js';

const PORT = env.PORT;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(`[HRMS Backend Server] running on http://localhost:${PORT}`);
  logger.info(`[Health check] http://localhost:${PORT}/health`);
  logger.info(`[API v1 Base] http://localhost:${PORT}/api/v1`);
  logger.info(`[ZKTeco ADMS Endpoint] http://localhost:${PORT}/iclock/cdata`);
});

// Biometric Device Offline Watchdog (Runs every 5 minutes)
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;
const watchdogInterval = setInterval(() => {
  biometricService.checkBiometricDeviceHealth().catch((err) => {
    logger.error('[ZKTeco Watchdog] Error in scheduled run:', err);
  });
}, WATCHDOG_INTERVAL_MS);

// Initial health check after 10s boot
setTimeout(() => {
  biometricService.checkBiometricDeviceHealth().catch((err) => {
    logger.error('[ZKTeco Watchdog] Error in initial run:', err);
  });
}, 10000);

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`\nReceived ${signal}. Closing server gracefully...`);
  clearInterval(watchdogInterval);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('[Prisma] Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

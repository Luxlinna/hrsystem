import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes/index.js';
import { biometricRoutes } from './routes/biometric.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';

export function createApp(): Express {
  const app = express();

  // Core Security & Utilities
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(express.text({ type: ['text/plain', 'text/html'], limit: '15mb' }));

  // Structured request logging
  app.use(requestLogger);

  // Root & Health check probes (/health, /health/ready)
  app.use('/health', healthRoutes);

  // Direct Hardware Endpoint for ZKTeco ADMS terminals (e.g. /iclock/cdata)
  app.use('/iclock', biometricRoutes);

  // REST API (/api and /api/v1)
  app.use('/api/v1', routes);
  app.use('/api', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

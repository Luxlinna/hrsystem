import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router } from './routes.js';
import { biometricRoutes } from './modules/biometrics/zkteco.routes.js';
import { errorHandler } from './common/middlewares/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // Core Security & Utilities
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(express.text({ type: ['text/plain', 'text/html'], limit: '15mb' }));

  // Direct Hardware Endpoint for ZKTeco ADMS terminals (e.g. /iclock/cdata)
  app.use('/iclock', biometricRoutes);

  // REST API v1
  app.use('/api/v1', router);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

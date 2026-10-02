import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router } from './routes.js';
import { errorHandler } from './common/middlewares/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // Core Security & Utilities
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: ['text/plain', 'text/html'] }));

  // API Route Prefix
  app.use('/api/v1', router);
  app.use('/iclock', router); // Hardware fallback path

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

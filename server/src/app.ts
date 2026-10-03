import express, { Express } from 'express';
import { routes } from './routes/index.js';
import { biometricRoutes } from './routes/biometric.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import {
  securityHeaders,
  corsSecurity,
  sanitizeRequest,
  requestIdMiddleware,
  requestLogger,
  notFoundHandler,
  errorHandler,
} from './middleware/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Request ID Tracking & Correlation
  app.use(requestIdMiddleware);

  // 2. HTTP Hardening & CORS
  app.use(securityHeaders);
  app.use(corsSecurity);

  // 3. Body Parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(express.text({ type: ['text/plain', 'text/html'], limit: '15mb' }));

  // 4. Request Sanitization (XSS & Injection filtering)
  app.use(sanitizeRequest);

  // 5. Structured Request Logging (with Request IDs)
  app.use(requestLogger);

  // 6. Direct Hardware Endpoint for ZKTeco ADMS terminals (e.g. /iclock/cdata)
  app.use('/iclock', biometricRoutes);

  // 7. Root & Health check probes (/health, /health/ready)
  app.use('/health', healthRoutes);

  // 8. REST API Endpoints (/api and /api/v1)
  app.use('/api/v1', routes);
  app.use('/api', routes);

  // 9. 404 Fallback Handler
  app.use(notFoundHandler);

  // 10. Centralized Safe Error Handler
  app.use(errorHandler);

  return app;
}

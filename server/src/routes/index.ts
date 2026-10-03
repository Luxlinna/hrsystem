import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { employeeRoutes } from './employee.routes.js';
import { attendanceRoutes } from './attendance.routes.js';
import { leaveRoutes } from './leave.routes.js';
import { biometricRoutes } from './biometric.routes.js';
import { healthRoutes } from './health.routes.js';
import { settingsRoutes } from './settings.routes.js';
import { generalApiLimiter } from '../middleware/rate-limit.middleware.js';

const apiRouter = Router();

// Apply general rate limiting across API
apiRouter.use(generalApiLimiter);

// Health check endpoints (/api/v1/health & /api/v1/health/ready)
apiRouter.use('/health', healthRoutes);

// Auth & Access Management
apiRouter.use('/auth', authRoutes);

// Domain REST API v1 routes
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);

// Hardware device routes
apiRouter.use('/iclock', biometricRoutes);

// System settings (SMTP test, etc.)
apiRouter.use('/settings', settingsRoutes);

export const routes = apiRouter;

import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { leaveRoutes } from './modules/leaves/leave.routes.js';
import { biometricRoutes } from './modules/biometrics/zkteco.routes.js';
import { generalApiLimiter } from './common/middlewares/rate-limit.middleware.js';

const apiRouter = Router();

// Apply general rate limiting across API v1
apiRouter.use(generalApiLimiter);

// Auth & Access Management
apiRouter.use('/auth', authRoutes);

// Domain REST API v1 routes
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);

// Hardware device routes fallback
apiRouter.use('/iclock', biometricRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const router = apiRouter;

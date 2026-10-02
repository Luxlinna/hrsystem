import { Router } from 'express';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { leaveRoutes } from './modules/leaves/leave.routes.js';
import { biometricRoutes } from './modules/biometrics/zkteco.routes.js';

const apiRouter = Router();

// Domain REST API v1 routes
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);

// Hardware device routes
apiRouter.use('/iclock', biometricRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const router = apiRouter;

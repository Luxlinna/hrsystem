import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { CheckInSchema } from '../validators/attendance.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', validateBody(CheckInSchema), attendanceController.checkIn);
router.post('/check-out', validateBody(CheckInSchema), attendanceController.checkOut);

export const attendanceRoutes = router;

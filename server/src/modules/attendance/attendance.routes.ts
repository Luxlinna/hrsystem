import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { CheckInSchema } from './dtos/checkin.dto.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', validateBody(CheckInSchema), attendanceController.checkIn);
router.post('/check-out', validateBody(CheckInSchema), attendanceController.checkOut);

export const attendanceRoutes = router;

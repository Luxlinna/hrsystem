import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { CreateLeaveSchema } from '../validators/leave.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/apply', validateBody(CreateLeaveSchema), leaveController.apply);
router.patch('/:id/approve', leaveController.approve);

export const leaveRoutes = router;

import { Router } from 'express';
import { leaveController } from './leave.controller.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { CreateLeaveSchema } from './dtos/leave.dto.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/apply', validateBody(CreateLeaveSchema), leaveController.apply);
router.patch('/:id/approve', leaveController.approve);

export const leaveRoutes = router;

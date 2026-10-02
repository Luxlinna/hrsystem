import { Router } from 'express';
import { employeeController } from './employee.controller.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { CreateEmployeeSchema } from './dtos/create-employee.dto.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

import { cacheResponse } from '../../common/middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

// Cached for 120s (2 minutes)
router.get('/', cacheResponse(120), employeeController.list);
router.get('/:id', cacheResponse(120), employeeController.getById);
router.post('/', validateBody(CreateEmployeeSchema), employeeController.create);

export const employeeRoutes = router;

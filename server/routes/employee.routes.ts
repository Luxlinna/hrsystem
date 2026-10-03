import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { CreateEmployeeSchema } from '../validators/employee.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { cacheResponse } from '../middleware/cache.middleware.js';

const router = Router();

router.use(authenticate);

// Cached for 120s (2 minutes)
router.get('/', cacheResponse(120), employeeController.list);
router.get('/:id', cacheResponse(120), employeeController.getById);
router.post('/', validateBody(CreateEmployeeSchema), employeeController.create);

export const employeeRoutes = router;

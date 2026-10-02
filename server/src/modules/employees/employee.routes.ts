import { Router } from 'express';
import { employeeController } from './employee.controller.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { CreateEmployeeSchema } from './dtos/create-employee.dto.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', employeeController.list);
router.get('/:id', employeeController.getById);
router.post('/', validateBody(CreateEmployeeSchema), employeeController.create);

export const employeeRoutes = router;

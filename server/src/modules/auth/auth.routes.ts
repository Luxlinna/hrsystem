import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authLoginLimiter, passwordResetLimiter } from '../../common/middlewares/rate-limit.middleware.js';
import {
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from './dtos/auth.dto.js';

const router = Router();

// Public Auth routes with brute-force rate limiters
router.post('/login', authLoginLimiter, validate(LoginSchema), authController.login);
router.post('/forgot-password', passwordResetLimiter, validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLoginLimiter, validate(ResetPasswordSchema), authController.resetPassword);

// Authenticated routes
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(ChangePasswordSchema), authController.changePassword);

export const authRoutes = router;

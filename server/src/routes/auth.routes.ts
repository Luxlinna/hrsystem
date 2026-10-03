import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLoginLimiter, passwordResetLimiter } from '../middleware/rate-limit.middleware.js';
import {
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public Auth routes with brute-force rate limiters
router.post('/login', authLoginLimiter, validate(LoginSchema), authController.login);
router.post('/forgot-password', passwordResetLimiter, validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLoginLimiter, validate(ResetPasswordSchema), authController.resetPassword);

// Authenticated routes
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(ChangePasswordSchema), authController.changePassword);

export const authRoutes = router;

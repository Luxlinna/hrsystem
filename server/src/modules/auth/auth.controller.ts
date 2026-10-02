import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/application/base.controller.js';
import { AuthService, authService } from './auth.service.js';
import { UnauthorizedError } from '../../core/errors/app.error.js';

export class AuthController extends BaseController {
  constructor(private service: AuthService = authService) {
    super();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.login(req.body);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.requestPasswordReset(req.body);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.resetPassword(req.body);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new UnauthorizedError();
      const result = await this.service.changePassword(req.user.id, req.body);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new UnauthorizedError();
      const result = await this.service.getCurrentUser(req.user.id, req.user.email);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();

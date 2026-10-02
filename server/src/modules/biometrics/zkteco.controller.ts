import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/application/base.controller.js';
import { BiometricService, biometricService } from './zkteco.service.js';

export class BiometricController extends BaseController {
  constructor(private service: BiometricService = biometricService) {
    super();
  }

  handleCdata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sn = (req.query.SN || req.query.sn || 'UNKNOWN') as string;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      // ZKTeco ADMS device punch format or json body
      if (req.body?.userPin && req.body?.punchTime) {
        await this.service.processPunchLog({
          deviceSn: sn,
          userPin: String(req.body.userPin),
          punchTime: new Date(req.body.punchTime),
          verifyType: req.body.verifyType,
          rawPayload: rawBody,
        });
      }

      // Standard ZKTeco ADMS handshake response
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('OK\n');
    } catch (err) {
      next(err);
    }
  };
}

export const biometricController = new BiometricController();

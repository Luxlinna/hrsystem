import { Request, Response } from 'express';
import { publicService } from '../services/public.service.js';
import { publicContactSchema } from '../validators/public.validator.js';
import { asyncHandler } from '../utils/async-handler.js';

export class PublicController {
  getInfo = asyncHandler(async (_req: Request, res: Response) => {
    const info = await publicService.getPublicSystemInfo();
    res.json({ success: true, data: info });
  });

  submitContact = asyncHandler(async (req: Request, res: Response) => {
    const parsed = publicContactSchema.parse(req.body);
    const result = await publicService.handleContactMessage(parsed);
    res.json({ success: true, data: result });
  });
}

export const publicController = new PublicController();

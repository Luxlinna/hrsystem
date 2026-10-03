import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    ...(req.id ? { requestId: req.id } : {}),
  });
}

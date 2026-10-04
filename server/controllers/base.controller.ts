import { Response } from 'express';
import { PageResult } from '../types/pagination.types.js';

export abstract class BaseController {
  protected ok<T>(res: Response, data: T, message = 'Success'): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  protected created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  protected paginated<T>(res: Response, result: PageResult<T>, message = 'Success'): Response {
    return res.status(200).json({
      success: true,
      message,
      data: result.items,
      pagination: result.meta,
    });
  }

  protected noContent(res: Response): Response {
    return res.status(204).send();
  }
}

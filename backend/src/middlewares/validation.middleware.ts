import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ResponseUtil } from '../utils/response.util';

export class ValidationMiddleware {
  static validate(req: Request, res: Response, next: NextFunction): void | Response {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return ResponseUtil.badRequest(
        res,
        'Validation failed',
        errors.array().map(err => ({
          field: err.type === 'field' ? err.path : undefined,
          message: err.msg,
        }))
      );
    }
    
    next();
  }
}
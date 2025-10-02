import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class ErrorMiddleware {
  static handle(
    error: any,
    req: Request,
    res: Response,
    _next: NextFunction
  ): Response {
    console.error('Error:', error);

    // Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return ErrorMiddleware.handlePrismaError(error, res);
    }

    // Validation errors (ví dụ dùng Joi, Yup, Zod...)
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    // Default error handler
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    });
  }

  private static handlePrismaError(
    error: PrismaClientKnownRequestError,
    res: Response
  ): Response {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'A record with this value already exists',
          field: (error.meta?.target as string[])?.join(', '),
        });

      case 'P2025': // Record not found
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });

      case 'P2003': // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          message: 'Invalid reference to related record',
        });

      case 'P2014': // Invalid ID
        return res.status(400).json({
          success: false,
          message: 'Invalid ID',
        });

      default:
        return res.status(500).json({
          success: false,
          message: 'Database error',
          ...(process.env.NODE_ENV === 'development' && {
            code: error.code,
            meta: error.meta,
          }),
        });
    }
  }

  static notFound(req: Request, res: Response): Response {
    return res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  }
}

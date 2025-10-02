import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    error?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      ...(error && process.env.NODE_ENV === 'development' && { error }),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(
    res: Response,
    message = 'Bad request',
    error?: any
  ): Response {
    return this.error(res, message, 400, error);
  }

  static unauthorized(
    res: Response,
    message = 'Unauthorized'
  ): Response {
    return this.error(res, message, 401);
  }

  static forbidden(
    res: Response,
    message = 'Forbidden'
  ): Response {
    return this.error(res, message, 403);
  }

  static notFound(
    res: Response,
    message = 'Resource not found'
  ): Response {
    return this.error(res, message, 404);
  }

  static conflict(
    res: Response,
    message = 'Conflict'
  ): Response {
    return this.error(res, message, 409);
  }
}
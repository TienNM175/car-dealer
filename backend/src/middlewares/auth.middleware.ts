import { Request, Response, NextFunction } from 'express';
import { JwtUtil, JwtPayload } from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';
import prisma from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseUtil.unauthorized(res, 'No token provided');
      }

      const token = authHeader.substring(7);

      try {
        const payload = JwtUtil.verifyAccessToken(token);

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, isActive: true, role: true, dealerId: true },
        });

        if (!user || !user.isActive) {
          return ResponseUtil.unauthorized(res, 'User not found or inactive');
        }

        req.user = payload;
        next();
      } catch (error) {
        return ResponseUtil.unauthorized(res, 'Invalid or expired token');
      }
    } catch (error) {
      return ResponseUtil.error(res, 'Authentication error');
    }
  }

  static optional(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = JwtUtil.verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token invalid but it's optional, continue without user
      }
    }

    next();
  }
}
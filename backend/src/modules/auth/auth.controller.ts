import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '../../utils/response.util';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return ResponseUtil.success(res, result, 'Login successful');
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        return ResponseUtil.unauthorized(res, error.message);
      }
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.substring(7) || '';
      const result = await authService.logout(token);
      return ResponseUtil.success(res, result, 'Logged out successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return ResponseUtil.badRequest(res, 'Refresh token is required');
      }

      const tokens = await authService.refreshToken(refreshToken);
      return ResponseUtil.success(res, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      return ResponseUtil.unauthorized(res, error.message);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      const user = await authService.getCurrentUser(req.user.userId);
      return ResponseUtil.success(res, user);
    } catch (error: any) {
      next(error);
    }
  }
}
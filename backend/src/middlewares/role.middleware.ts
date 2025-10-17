import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';

type UserRole = 'ADMIN' | 'EVM_STAFF' | 'DEALER_MANAGER' | 'DEALER_STAFF';

export class RoleMiddleware {
  static requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        return ResponseUtil.forbidden(
          res,
          'You do not have permission to access this resource'
        );
      }

      next();
    };
  }

  static requireAdmin(req: Request, res: Response, next: NextFunction): void | Response {
    return RoleMiddleware.requireRole('ADMIN')(req, res, next);
  }

  static requireEVMStaff(req: Request, res: Response, next: NextFunction): void | Response {
    return RoleMiddleware.requireRole('ADMIN', 'EVM_STAFF')(req, res, next);
  }

  static requireDealerManager(req: Request, res: Response, next: NextFunction): void | Response {
    return RoleMiddleware.requireRole('ADMIN', 'EVM_STAFF', 'DEALER_MANAGER')(req, res, next);
  }

  static requireDealerStaff(req: Request, res: Response, next: NextFunction): void | Response {
    return RoleMiddleware.requireRole(
      'ADMIN',
      'DEALER_MANAGER',
      'DEALER_STAFF'
    )(req, res, next);
  }

  static requireSameDealer(req: Request, res: Response, next: NextFunction): void | Response {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }

    const dealerId = req.params.dealerId || req.body.dealerId;

    // Admin and EVM staff can access all dealers
    if (req.user.role === 'ADMIN' || req.user.role === 'EVM_STAFF') {
      return next();
    }

    // Dealer staff can only access their own dealer
    if (req.user.dealerId !== dealerId) {
      return ResponseUtil.forbidden(
        res,
        'You can only access your own dealer resources'
      );
    }

    next();
  }
}
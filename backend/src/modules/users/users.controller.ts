import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { ResponseUtil } from "../../utils/response.util";

const usersService = new UsersService();

export class UsersController {
  /**
   * Create new user
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const user = await usersService.createUser(req.body, req.user.userId);
      return ResponseUtil.created(res, user, "User created successfully");
    } catch (error: any) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("must be assigned") ||
        error.message.includes("cannot be assigned") ||
        error.message.includes("can only create")
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * List users
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const result = await usersService.listUsers(
        {
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
          search: req.query.search as string,
          role: req.query.role as any,
          dealerId: req.query.dealerId as string,
          isActive:
            req.query.isActive === "true"
              ? true
              : req.query.isActive === "false"
                ? false
                : undefined,
        },
        req.user.userId
      );

      return ResponseUtil.success(
        res,
        {
          users: result.data,
          pagination: result.pagination,
        },
        "Users retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const user = await usersService.getUserById(
        req.params.id,
        req.user.userId
      );

      return ResponseUtil.success(res, user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return ResponseUtil.notFound(res, "User not found");
      }
      if (error.message.includes("can only view")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const user = await usersService.updateUser(
        req.params.id,
        req.body,
        req.user.userId
      );

      return ResponseUtil.success(res, user, "User updated successfully");
    } catch (error: any) {
      if (error.message === "User not found") {
        return ResponseUtil.notFound(res, "User not found");
      }
      if (
        error.message.includes("can only update") ||
        error.message.includes("cannot change") ||
        error.message.includes("do not have permission")
      ) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const result = await usersService.deleteUser(
        req.params.id,
        req.user.userId
      );

      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message === "User not found") {
        return ResponseUtil.notFound(res, "User not found");
      }
      if (error.message.includes("Only administrators")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Assign user to dealer
   */
  async assignToDealer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { dealerId } = req.body;

      if (!dealerId) {
        return ResponseUtil.badRequest(res, "Dealer ID is required");
      }

      const user = await usersService.assignToDealer(
        req.params.id,
        dealerId,
        req.user.userId
      );

      return ResponseUtil.success(
        res,
        user,
        "User assigned to dealer successfully"
      );
    } catch (error: any) {
      if (
        error.message === "User not found" ||
        error.message === "Dealer not found"
      ) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (
        error.message.includes("Only administrators") ||
        error.message.includes("cannot be assigned")
      ) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, "Authentication required");
    }

    const { oldPassword, newPassword } = req.body;

    if (!newPassword) {
      return ResponseUtil.badRequest(res, "New password is required");
    }

    const result = await usersService.changePassword(
      req.params.id,
      oldPassword,
      newPassword,
      req.user.userId
    );

    return ResponseUtil.success(res, result);
  } catch (error: any) {
    if (error.message === "User not found") {
      return ResponseUtil.notFound(res, "User not found");
    }
    if (error.message.includes("Current password is incorrect")) {
      return ResponseUtil.badRequest(res, error.message);
    }
    if (
      error.message.includes("can only change your own") ||
      error.message.includes("Password must")
    ) {
      return ResponseUtil.badRequest(res, error.message);
    }
    return next(error);
  }
}


  /**
   * Toggle user active status
   */
  async toggleActiveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return ResponseUtil.badRequest(res, "isActive must be a boolean value");
      }

      const user = await usersService.updateUser(
        req.params.id,
        { isActive },
        req.user.userId
      );

      return ResponseUtil.success(
        res,
        user,
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error: any) {
      if (error.message === "User not found") {
        return ResponseUtil.notFound(res, "User not found");
      }
      return next(error);
    }
  }
}

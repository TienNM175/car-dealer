import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    dealerId?: number;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if session exists in Redis
    const sessionExists = await redis.exists(`session:${decoded.userId}`);

    if (!sessionExists) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      dealerId: decoded.dealerId,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const requireDealerAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin and EVM staff can access all dealers
  if (["ADMIN", "EVM_STAFF"].includes(req.user.role)) {
    return next();
  }

  // Dealer staff and managers can only access their own dealer
  if (["DEALER_MANAGER", "DEALER_STAFF"].includes(req.user.role)) {
    if (!req.user.dealerId) {
      return res.status(403).json({ error: "No dealer assigned" });
    }
    return next();
  }

  return res.status(403).json({ error: "Insufficient permissions" });
};

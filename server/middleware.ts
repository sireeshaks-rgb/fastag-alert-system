import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { storage } from './storage';

declare module 'express' {
  interface Request {
    userId?: number;
    userEmail?: string;
    userRole?: number;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await storage.getUser(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.roleId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(...allowedRoleIds: number[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId || !allowedRoleIds.includes(req.userRole || 0)) {
      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

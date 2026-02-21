import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models';
import { logger } from './logger';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign({ userId }, secret, { expiresIn } as any);
};

export const verifyToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.verify(token, secret) as { userId: string };
};

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const requireOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'owner' && req.user?.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      message: 'Store owner access required'
    });
    return;
  }
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }
  next();
};

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      message: 'Superadmin access required'
    });
    return;
  }
  next();
};
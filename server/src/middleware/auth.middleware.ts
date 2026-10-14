import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/env.js';
import { Role, UserStatus } from '../../../shared/src/enums.js';
import { User, type IUser } from '../models/index.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export interface AuthedRequest extends Request {
  user: IUser;
}

interface AccessPayload {
  sub: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export function signAccessToken(user: IUser): string {
  const payload: AccessPayload = { sub: String(user._id), role: user.role };
  return jwt.sign(payload, appConfig.jwt.accessSecret, {
    expiresIn: appConfig.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw unauthorized('Authentication required');
    }
    const token = header.slice(7).trim();
    if (!token) throw unauthorized('Authentication required');

    let payload: AccessPayload;
    try {
      payload = jwt.verify(token, appConfig.jwt.accessSecret) as AccessPayload;
    } catch {
      throw unauthorized('Invalid or expired access token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw unauthorized('Invalid or expired access token');

    if (user.status === UserStatus.SUSPENDED) {
      throw forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
    }
    if (user.status === UserStatus.LOCKED) {
      const locked = user.lockedUntil && user.lockedUntil.getTime() > Date.now();
      if (locked) throw unauthorized('Account temporarily locked due to failed logins', 'ACCOUNT_LOCKED');
      user.status = UserStatus.ACTIVE;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized('Authentication required'));
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

export function requireUser(req: Request): IUser {
  if (!req.user) throw unauthorized('Authentication required');
  return req.user;
}

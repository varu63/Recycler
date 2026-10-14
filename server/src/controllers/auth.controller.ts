import type { NextFunction, Request, Response } from 'express';
import { clientIp } from '../middleware/audit.middleware.js';
import { REFRESH_COOKIE, changePassword, forgotPassword, getProfile, login, logout, refresh, register, resetPassword, updateProfile } from '../services/auth.service.js';
import { success } from '../utils/response.js';

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await register(req.body, res, { ip: clientIp(req) });
    success(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await login(req.body, res, { ip: clientIp(req) });
    success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const result = await logout(token, res, {
      userId: req.user ? String(req.user._id) : null,
      ip: clientIp(req),
    });
    success(res, result, 'Logged out');
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const result = await refresh(token, res, { ip: clientIp(req) });
    success(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await forgotPassword(req.body, { ip: clientIp(req) });
    success(res, result, 'If an account exists for that email, a reset link has been sent');
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resetPassword(req.body, { ip: clientIp(req) });
    success(res, result, 'Password has been reset');
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await changePassword(String(req.user!._id), req.body, { ip: clientIp(req) });
    success(res, result, 'Password changed');
  } catch (error) {
    next(error);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getProfile(String(req.user!._id));
    success(res, { user });
  } catch (error) {
    next(error);
  }
}

export async function updateMeController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await updateProfile(String(req.user!._id), req.body, { ip: clientIp(req) });
    success(res, { user }, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

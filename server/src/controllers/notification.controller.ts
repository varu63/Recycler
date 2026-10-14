import type { NextFunction, Request, Response } from 'express';
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from '../services/notification.service.js';
import { success } from '../utils/response.js';

export async function listNotificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listNotifications(String(req.user!._id), req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function unreadCountController(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await unreadCount(String(req.user!._id));
    success(res, { count });
  } catch (error) {
    next(error);
  }
}

export async function markReadController(req: Request, res: Response, next: NextFunction) {
  try {
    await markRead(String(req.user!._id), req.params.id!);
    success(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

export async function markAllReadController(req: Request, res: Response, next: NextFunction) {
  try {
    await markAllRead(String(req.user!._id));
    success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}

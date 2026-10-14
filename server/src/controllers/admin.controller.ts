import type { NextFunction, Request, Response } from 'express';
import {
  getDashboard,
  getReports,
  getSettings,
  listUsers,
  updateUserStatus,
} from '../services/admin.service.js';
import { listAuditLogs } from '../services/audit.service.js';
import { success } from '../utils/response.js';

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getDashboard();
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listUsers(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await updateUserStatus(req, req.params.id!, req.body.status);
    success(res, { user }, 'User status updated');
  } catch (error) {
    next(error);
  }
}

export async function auditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listAuditLogs(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function reportsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getReports();
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function settingsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = getSettings();
    success(res, data);
  } catch (error) {
    next(error);
  }
}

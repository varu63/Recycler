import { Router } from 'express';
import {
  auditLogsController,
  dashboardController,
  listUsersController,
  reportsController,
  settingsController,
  updateUserStatusController,
} from '../controllers/admin.controller.js';
import { authorize, authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { Role } from '../../../shared/src/enums.js';
import { auditLogQuerySchema, userListQuerySchema, userStatusSchema } from '../validators/admin.validators.js';
import { idParamsSchema } from '../validators/common.js';

export function createAdminRoutes(): Router {
  const router = Router();

  router.use(authenticate, authorize(Role.ADMIN));

  router.get('/dashboard', dashboardController);
  router.get('/users', validateQuery(userListQuerySchema), listUsersController);
  router.patch(
    '/users/:id/status',
    validateParams(idParamsSchema),
    validateBody(userStatusSchema),
    updateUserStatusController
  );
  router.get('/audit-logs', validateQuery(auditLogQuerySchema), auditLogsController);
  router.get('/reports', reportsController);
  router.get('/settings', settingsController);

  return router;
}

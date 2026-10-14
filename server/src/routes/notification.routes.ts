import { Router } from 'express';
import {
  listNotificationsController,
  markAllReadController,
  markReadController,
  unreadCountController,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { idParamsSchema } from '../validators/common.js';
import { notificationListQuerySchema } from '../validators/notification.validators.js';

export function createNotificationRoutes(): Router {
  const router = Router();

  router.use(authenticate);
  router.get('/', validateQuery(notificationListQuerySchema), listNotificationsController);
  router.get('/unread-count', unreadCountController);
  router.post('/read-all', markAllReadController);
  router.post('/:id/read', validateParams(idParamsSchema), markReadController);

  return router;
}

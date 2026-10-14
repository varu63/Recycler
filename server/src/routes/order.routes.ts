import { Router } from 'express';
import {
  cancelOrderController,
  createOrderController,
  getOrderController,
  listOrdersController,
  updateOrderStatusController,
} from '../controllers/order.controller.js';
import { authorize, authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { Role } from '../../../shared/src/enums.js';
import { idParamsSchema } from '../validators/common.js';
import {
  cancelOrderSchema,
  createOrderSchema,
  orderListQuerySchema,
  orderStatusSchema,
} from '../validators/order.validators.js';

export function createOrderRoutes(): Router {
  const router = Router();

  router.post(
    '/',
    authenticate,
    authorize(Role.CUSTOMER),
    validateBody(createOrderSchema),
    createOrderController
  );
  router.get('/', authenticate, validateQuery(orderListQuerySchema), listOrdersController);
  router.get('/:id', authenticate, validateParams(idParamsSchema), getOrderController);
  router.patch(
    '/:id/status',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(orderStatusSchema),
    updateOrderStatusController
  );
  router.post(
    '/:id/cancel',
    authenticate,
    validateParams(idParamsSchema),
    validateBody(cancelOrderSchema),
    cancelOrderController
  );

  return router;
}

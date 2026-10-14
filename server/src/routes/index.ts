import { Router } from 'express';
import { createAdminRoutes } from './admin.routes.js';
import { createAuthRoutes } from './auth.routes.js';
import {
  createInspectionsRouter,
  createOffersRouter,
  createRequestsRouter,
} from './material-request.routes.js';
import {
  createProcessedInventoryRouter,
  createProcessingRouter,
  createRawInventoryRouter,
} from './inventory.routes.js';
import { createMarketplaceRoutes } from './marketplace.routes.js';
import { createNotificationRoutes } from './notification.routes.js';
import { createOrderRoutes } from './order.routes.js';
import { createUploadRoutes } from './upload.routes.js';

export function createApiRouter(): Router {
  const apiRouter = Router();

  apiRouter.use('/auth', createAuthRoutes());
  apiRouter.use('/uploads', createUploadRoutes());
  apiRouter.use('/material-requests', createRequestsRouter());
  apiRouter.use('/offers', createOffersRouter());
  apiRouter.use('/inspections', createInspectionsRouter());
  apiRouter.use('/raw-inventory', createRawInventoryRouter());
  apiRouter.use('/processing', createProcessingRouter());
  apiRouter.use('/processed-inventory', createProcessedInventoryRouter());
  apiRouter.use('/marketplace', createMarketplaceRoutes());
  apiRouter.use('/orders', createOrderRoutes());
  apiRouter.use('/notifications', createNotificationRoutes());
  apiRouter.use('/admin', createAdminRoutes());

  return apiRouter;
}

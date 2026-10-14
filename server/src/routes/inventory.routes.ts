import { Router } from 'express';
import {
  listRawInventoryController,
  updateRawInventoryController,
} from '../controllers/inventory.controller.js';
import {
  completeProcessingController,
  createProcessingController,
  listProcessedInventoryController,
  listProcessingController,
  updateProcessingController,
} from '../controllers/processing.controller.js';
import { authorize, authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { Role } from '../../../shared/src/enums.js';
import { idParamsSchema } from '../validators/common.js';
import {
  completeProcessingSchema,
  createProcessingSchema,
  processedListQuerySchema,
  processingListQuerySchema,
  rawInventoryListQuerySchema,
  updateProcessingSchema,
  updateRawInventorySchema,
} from '../validators/processing.validators.js';

export function createRawInventoryRouter(): Router {
  const rawInventoryRouter = Router();

  rawInventoryRouter.use(authenticate, authorize(Role.ADMIN));
  rawInventoryRouter.get(
    '/',
    validateQuery(rawInventoryListQuerySchema),
    listRawInventoryController
  );
  rawInventoryRouter.patch(
    '/:id',
    validateParams(idParamsSchema),
    validateBody(updateRawInventorySchema),
    updateRawInventoryController
  );

  return rawInventoryRouter;
}

export function createProcessingRouter(): Router {
  const processingRouter = Router();

  processingRouter.use(authenticate, authorize(Role.ADMIN));
  processingRouter.get('/', validateQuery(processingListQuerySchema), listProcessingController);
  processingRouter.post('/', validateBody(createProcessingSchema), createProcessingController);
  processingRouter.patch(
    '/:id',
    validateParams(idParamsSchema),
    validateBody(updateProcessingSchema),
    updateProcessingController
  );
  processingRouter.post(
    '/:id/complete',
    validateParams(idParamsSchema),
    validateBody(completeProcessingSchema),
    completeProcessingController
  );

  return processingRouter;
}

export function createProcessedInventoryRouter(): Router {
  const processedInventoryRouter = Router();

  processedInventoryRouter.use(authenticate, authorize(Role.ADMIN));
  processedInventoryRouter.get(
    '/',
    validateQuery(processedListQuerySchema),
    listProcessedInventoryController
  );

  return processedInventoryRouter;
}

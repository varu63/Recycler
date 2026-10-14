import { Router } from 'express';
import {
  acceptOfferController,
  completeRequestController,
  createInspectionController,
  createOfferController,
  createRequestController,
  getRequestController,
  listInspectionsController,
  listOffersController,
  listRequestsController,
  purchaseRequestController,
  rejectOfferController,
  rejectRequestController,
  reviewRequestController,
  scheduleInspectionController,
} from '../controllers/material-request.controller.js';
import { authorize, authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { Role } from '../../../shared/src/enums.js';
import {
  createInspectionSchema,
  inspectionListQuerySchema,
} from '../validators/inspection.validators.js';
import {
  createMaterialRequestSchema,
  materialRequestListQuerySchema,
  rejectRequestSchema,
  scheduleInspectionSchema,
} from '../validators/material-request.validators.js';
import { createOfferSchema, offerListQuerySchema } from '../validators/offer.validators.js';
import { idParamsSchema } from '../validators/common.js';

export function createRequestsRouter(): Router {
  const requestsRouter = Router();

  requestsRouter.get(
    '/',
    authenticate,
    validateQuery(materialRequestListQuerySchema),
    listRequestsController
  );
  requestsRouter.post(
    '/',
    authenticate,
    authorize(Role.CUSTOMER),
    validateBody(createMaterialRequestSchema),
    createRequestController
  );
  requestsRouter.get('/:id', authenticate, validateParams(idParamsSchema), getRequestController);
  requestsRouter.post(
    '/:id/review',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    reviewRequestController
  );
  requestsRouter.post(
    '/:id/schedule-inspection',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(scheduleInspectionSchema),
    scheduleInspectionController
  );
  requestsRouter.post(
    '/:id/inspection',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(createInspectionSchema),
    createInspectionController
  );
  requestsRouter.post(
    '/:id/offer',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(createOfferSchema),
    createOfferController
  );
  requestsRouter.post(
    '/:id/accept-offer',
    authenticate,
    validateParams(idParamsSchema),
    acceptOfferController
  );
  requestsRouter.post(
    '/:id/reject-offer',
    authenticate,
    validateParams(idParamsSchema),
    rejectOfferController
  );
  requestsRouter.post(
    '/:id/purchase',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    purchaseRequestController
  );
  requestsRouter.post(
    '/:id/complete',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    completeRequestController
  );
  requestsRouter.post(
    '/:id/reject',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(rejectRequestSchema),
    rejectRequestController
  );

  return requestsRouter;
}

export function createOffersRouter(): Router {
  const offersRouter = Router();
  offersRouter.get(
    '/',
    authenticate,
    validateQuery(offerListQuerySchema),
    listOffersController
  );
  return offersRouter;
}

export function createInspectionsRouter(): Router {
  const inspectionsRouter = Router();
  inspectionsRouter.get(
    '/',
    authenticate,
    authorize(Role.ADMIN),
    validateQuery(inspectionListQuerySchema),
    listInspectionsController
  );
  return inspectionsRouter;
}

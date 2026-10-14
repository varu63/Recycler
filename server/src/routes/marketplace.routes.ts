import { Router } from 'express';
import {
  createListingController,
  getListingProvenanceController,
  getPublicListingController,
  listAdminController,
  listPublicController,
  updateListingController,
} from '../controllers/marketplace.controller.js';
import { authorize, authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { Role } from '../../../shared/src/enums.js';
import { idParamsSchema } from '../validators/common.js';
import {
  adminListingQuerySchema,
  createListingSchema,
  marketplaceQuerySchema,
  updateListingSchema,
} from '../validators/listing.validators.js';

export function createMarketplaceRoutes(): Router {
  const router = Router();

  router.get(
    '/admin',
    authenticate,
    authorize(Role.ADMIN),
    validateQuery(adminListingQuerySchema),
    listAdminController
  );
  router.get('/', validateQuery(marketplaceQuerySchema), listPublicController);
  router.get('/:id/provenance', validateParams(idParamsSchema), getListingProvenanceController);
  router.get('/:id', validateParams(idParamsSchema), getPublicListingController);
  router.post(
    '/',
    authenticate,
    authorize(Role.ADMIN),
    validateBody(createListingSchema),
    createListingController
  );
  router.patch(
    '/:id',
    authenticate,
    authorize(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(updateListingSchema),
    updateListingController
  );

  return router;
}

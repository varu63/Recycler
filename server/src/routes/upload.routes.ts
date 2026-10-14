import { Router } from 'express';
import {
  deleteImageController,
  uploadImagesController,
} from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createUploadRateLimit } from '../middleware/rate-limit.middleware.js';
import { parseImages } from '../middleware/upload.middleware.js';

export function createUploadRoutes(): Router {
  const router = Router();

  router.post('/image', authenticate, createUploadRateLimit(), parseImages, uploadImagesController);
  router.post('/images', authenticate, createUploadRateLimit(), parseImages, uploadImagesController);

  router.delete('/image/*', authenticate, createUploadRateLimit(), deleteImageController);
  router.delete('/images/*', authenticate, createUploadRateLimit(), deleteImageController);

  return router;
}

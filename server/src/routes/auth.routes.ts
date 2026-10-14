import { Router } from 'express';
import {
  changePasswordController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resetPasswordController,
  updateMeController,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createForgotRateLimit,
  createLoginRateLimit,
  createRegisterRateLimit,
} from '../middleware/rate-limit.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';

export function createAuthRoutes(): Router {
  const router = Router();

  router.post(
    '/register',
    createRegisterRateLimit(),
    validateBody(registerSchema),
    registerController
  );
  router.post('/login', createLoginRateLimit(), validateBody(loginSchema), loginController);
  router.post('/logout', logoutController);
  router.post('/refresh', refreshController);
  router.post(
    '/forgot-password',
    createForgotRateLimit(),
    validateBody(forgotPasswordSchema),
    forgotPasswordController
  );
  router.post('/reset-password', validateBody(resetPasswordSchema), resetPasswordController);
  router.post(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    changePasswordController
  );
  router.get('/me', authenticate, meController);
  router.patch('/me', authenticate, validateBody(updateProfileSchema), updateMeController);

  return router;
}

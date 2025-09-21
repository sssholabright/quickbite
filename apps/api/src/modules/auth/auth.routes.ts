import { Router } from 'express';
import { authGuard } from './../../middlewares/authGuard.js';
import { AuthController } from './auth.controller.js';
import { registrationRateLimit } from './../../middlewares/rateLimiter.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', registrationRateLimit, AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes (authentication required)
router.use(authGuard()); // Apply auth guard to all routes below

router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
// Change password route - remove duplicate authGuard
router.put('/change-password', AuthController.changePassword);

export default router;
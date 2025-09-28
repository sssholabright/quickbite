import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';
import { uploadSingleImage, handleUploadError } from '../../middlewares/upload.middleware.js';
import { fileUploadRateLimit } from '../../middlewares/rateLimiter.js';
import { registrationRateLimit } from './../../middlewares/rateLimiter.js';

const router = Router();

// Auth routes
router.post('/register', registrationRateLimit, AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authGuard({ requiredRoles: ['CUSTOMER', 'RIDER', 'VENDOR', 'ADMIN'] }), AuthController.logout);

// Profile routes with image upload support
router.get('/profile', authGuard({ requiredRoles: ['CUSTOMER', 'RIDER', 'VENDOR', 'ADMIN'] }), AuthController.getProfile);
router.put('/profile', 
    fileUploadRateLimit,
    authGuard({ requiredRoles: ['CUSTOMER', 'RIDER', 'VENDOR', 'ADMIN'] }),
    uploadSingleImage,
    handleUploadError,
    AuthController.updateProfile
);

// Change password route
router.put('/change-password', AuthController.changePassword);

export default router;
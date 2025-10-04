import { Router } from 'express';
import { VendorController } from './vendor.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';
import { uploadSingleImage, handleUploadError } from '../../middlewares/upload.middleware.js';
import { fileUploadRateLimit } from '../../middlewares/rateLimiter.js';

const router = Router();

// Get vendor profile
router.get('/profile', 
    authGuard({ requiredRoles: ['VENDOR'] }), 
    VendorController.getProfile
);

// Update vendor profile with image upload support
router.put('/profile', 
    fileUploadRateLimit,
    uploadSingleImage,
    handleUploadError,
    authGuard({ requiredRoles: ['VENDOR'] }),
    VendorController.updateProfile
);

// Update vendor settings (business hours, etc.)
router.put('/settings', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    VendorController.updateSettings
);

// Get vendor statistics
router.get('/stats', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    VendorController.getStats
);

export default router;
import { Router } from 'express';
import { MenuController } from './menu.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';
import { uploadSingleImage, handleUploadError } from '../../middlewares/upload.middleware.js';
import { fileUploadRateLimit } from '../../middlewares/rateLimiter.js';

const router = Router();

// Menu item routes with image upload support
router.post('/menu-items', 
    fileUploadRateLimit,
    authGuard({ requiredRoles: ['VENDOR'] }),
    uploadSingleImage,
    handleUploadError,
    MenuController.createMenuItem
);

router.put('/menu-items/:menuItemId', 
    fileUploadRateLimit,
    authGuard({ requiredRoles: ['VENDOR'] }),
    uploadSingleImage,
    handleUploadError,
    MenuController.updateMenuItem
);

// 🚀 FIX: Add auth guards to GET routes
router.get('/menu-items', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.getVendorMenuItems
);

router.get('/menu-items/:menuItemId', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.getMenuItem
);

router.delete('/menu-items/:menuItemId', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.deleteMenuItem
);

router.patch('/menu-items/:menuItemId/toggle', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.toggleMenuItemAvailability
);

// Category routes with image upload support
router.post('/categories', 
    fileUploadRateLimit,
    authGuard({ requiredRoles: ['VENDOR'] }),
    uploadSingleImage,
    handleUploadError,
    MenuController.createCategory
);

router.put('/categories/:categoryId', 
    fileUploadRateLimit,
    authGuard({ requiredRoles: ['VENDOR'] }),
    uploadSingleImage,
    handleUploadError,
    MenuController.updateCategory
);

// 🚀 FIX: Add auth guards to GET routes
router.get('/categories', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.getVendorCategories
);

router.delete('/categories/:categoryId', 
    authGuard({ requiredRoles: ['VENDOR'] }),
    MenuController.deleteCategory
);

// Add this route (public, no auth required)
router.get('/categories/all', MenuController.getAllCategories);

// Public routes (no auth required)
router.get('/vendors', MenuController.getCustomerVendors);
router.get('/vendors/:vendorId/categories', MenuController.getCustomerCategories);
router.get('/vendors/:vendorId/menu-items', MenuController.getCustomerMenuItems);

export default router;
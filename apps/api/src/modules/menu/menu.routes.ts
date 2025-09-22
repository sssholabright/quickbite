import { Router } from 'express';
import { MenuController } from './menu.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';

const router = Router();

// Public routes
router.get('/public/:vendorId/categories', MenuController.getCustomerCategories);
router.get('/public/:vendorId/items', MenuController.getCustomerMenuItems);
router.get('/public/vendors', MenuController.getCustomerVendors);

// Apply authentication with VENDOR and ADMIN roles
router.use(authGuard({ requiredRoles: ['VENDOR', 'ADMIN'] }));

// Menu Item routes
router.post('/items', MenuController.createMenuItem);
router.get('/items', MenuController.getVendorMenuItems);
router.get('/items/:menuItemId', MenuController.getMenuItem);
router.put('/items/:menuItemId', MenuController.updateMenuItem);
router.delete('/items/:menuItemId', MenuController.deleteMenuItem);
router.patch('/items/:menuItemId/toggle-availability', MenuController.toggleMenuItemAvailability);

// Category routes
router.post('/categories', MenuController.createCategory);
router.get('/categories', MenuController.getVendorCategories);
router.put('/categories/:categoryId', MenuController.updateCategory);
router.delete('/categories/:categoryId', MenuController.deleteCategory);

export default router;
import { Router } from 'express';
import { authGuard } from '../../../middlewares/authGuard.js';
import { AdminController } from './admin.controller.js';

const router = Router();

// Admin login (public route)
router.post('/login', AdminController.login);

// Create admin (protected route)
router.post('/create', authGuard({ requiredRoles: ['ADMIN'] }), AdminController.createAdmin);

// Get admin profile (protected route)
router.get('/profile', authGuard({ requiredRoles: ['ADMIN'] }), AdminController.getProfile);

export default router;
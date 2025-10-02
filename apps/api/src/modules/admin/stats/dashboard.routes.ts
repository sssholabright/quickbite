import { DashboardController } from './dashboard.controller.js';
import { authGuard } from './../../../middlewares/authGuard.js';
import { Router } from 'express';

const router = Router();

// Dashboard routes (protected)
router.get('/dashboard/stats', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getDashboardStats);
router.get('/activity-feed', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getActivityFeed);

// Analytics routes (protected)
router.get('/analytics/orders', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getOrderAnalytics);
router.get('/analytics/riders', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getRiderAnalytics);
router.get('/analytics/vendors', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getVendorAnalytics);
router.get('/analytics/customers', authGuard({ requiredRoles: ['ADMIN'] }), DashboardController.getCustomerAnalytics);

export default router;
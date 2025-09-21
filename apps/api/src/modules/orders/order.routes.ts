import { Router } from "express";
import { authGuard, requireRole } from './../../middlewares/authGuard.js';
import { OrderController } from './order.controller.js';
import { orderCreationRateLimit } from './../../middlewares/rateLimiter.js';

const router = Router();

// All routes require authentication
router.use(authGuard());

// Create order (customers only)
router.post('/', requireRole('CUSTOMER'), orderCreationRateLimit, OrderController.createOrder);

// Get order by ID (any authenticated user)
router.get('/:id', OrderController.getOrderById);

// Get orders with filters (any authenticated user)
router.get('/', OrderController.getOrders);

// Update order status (vendors, riders, admins)
router.put('/:id/status', requireRole('VENDOR', 'RIDER', 'ADMIN'), OrderController.updateOrderStatus);

// Cancel order (customers, vendors, admins)
router.put('/:id/cancel', requireRole('CUSTOMER', 'VENDOR', 'ADMIN'), OrderController.cancelOrder
);

// Get order statistics (any authenticated user)
router.get('/stats/overview', OrderController.getOrderStats);

export default router;
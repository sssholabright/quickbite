import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';

const router = Router();

// Create order (Customer only)
router.post('/', 
    authGuard({ requiredRoles: ['CUSTOMER'] }),
    OrderController.createOrder
);

// Get orders (All authenticated users)
router.get('/',
    authGuard({ requiredRoles: ['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] }),
    OrderController.getOrders
);

// Get order statistics (All authenticated users)
router.get('/stats',
    authGuard({ requiredRoles: ['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] }),
    OrderController.getOrderStats
);

// Get order by ID (All authenticated users)
router.get('/:orderId',
    authGuard({ requiredRoles: ['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] }),
    OrderController.getOrderById
);

// Update order status (Vendor, Rider, Admin only)
router.patch('/:orderId/status',
    authGuard({ requiredRoles: ['VENDOR', 'RIDER', 'ADMIN'] }),
    OrderController.updateOrderStatus
);

// Cancel order (Customer, Vendor, Rider, Admin)
router.patch('/:orderId/cancel',
    authGuard({ requiredRoles: ['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'] }),
    OrderController.cancelOrder
);

// Add these new routes
router.post('/broadcast-ready', authGuard, OrderController.broadcastExistingReadyOrders);
router.post('/test-socket-emission', authGuard, OrderController.testSocketEmission);

export default router;
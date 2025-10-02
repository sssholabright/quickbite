import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';

const router = Router();

// All routes require admin authentication
router.use(authGuard());

// Get orders list - requires orders.read permission
router.get('/', 
    requirePermission('orders.read'),
    OrdersController.getOrdersList
);

// Get single order details - requires orders.read permission
router.get('/:id',
    requirePermission('orders.read'),
    OrdersController.getOrderDetails
);

// Reassign rider - requires orders.write permission
router.post('/:id/reassign',
    requirePermission('orders.write'),
    OrdersController.reassignRider
);

// Cancel order - requires orders.write permission
router.post('/:id/cancel',
    requirePermission('orders.write'),
    OrdersController.cancelOrder
);

// Refund order - requires orders.refund permission
router.post('/:id/refund',
    requirePermission('orders.refund'),
    OrdersController.refundOrder
);

export { router as ordersRoutes };
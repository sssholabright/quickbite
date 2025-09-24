import { Router } from 'express';
import { requireRider } from '../../middlewares/authGuard.js';
import { RiderController } from './rider.controller.js';

const router = Router();

// Apply auth guard to all routes
router.use(requireRider);

// Rider status routes
router.put('/status', RiderController.updateStatus);
router.get('/status', RiderController.getStatus);

// 🚀 NEW: Delivery job routes
router.post('/delivery-jobs/:orderId/accept', RiderController.acceptDeliveryJob);
router.post('/delivery-jobs/:orderId/reject', RiderController.rejectDeliveryJob);

export default router;
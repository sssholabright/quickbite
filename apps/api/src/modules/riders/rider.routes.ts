import { Router } from 'express';
import { requireRider } from '../../middlewares/authGuard.js';
import { RiderController } from './rider.controller.js';

const router = Router();

// Apply auth guard to all routes
router.use(requireRider);

// Rider status routes
router.put('/status', RiderController.updateStatus);
router.get('/status', RiderController.getStatus);

// 🚀 NEW: Push token routes
router.patch('/push-token', RiderController.updatePushToken);
router.get('/push-token', RiderController.getPushToken);

// 🚀 NEW: Delivery job routes
router.post('/delivery-jobs/:orderId/accept', RiderController.acceptDeliveryJob);
router.post('/delivery-jobs/:orderId/reject', RiderController.rejectDeliveryJob);

// 🚀 NEW: Location routes
router.put('/location', RiderController.updateLocation);
router.get('/location', RiderController.getCurrentLocation);

// 🚀 NEW: Earnings routes
router.get('/earnings', RiderController.getEarnings);
router.get('/earnings/summary', RiderController.getEarningsSummary);

export default router;
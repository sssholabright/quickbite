import { Router } from 'express';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';
import { RiderController } from './riders.controller.js';

const router = Router();
router.use(authGuard());

// Riders routes
router.get('/', requirePermission('riders.read'), RiderController.getRidersList);
router.get('/:id', requirePermission('riders.read'), RiderController.getRiderDetails);
router.post('/', requirePermission('riders.write'), RiderController.createRider);
router.put('/:id', requirePermission('riders.write'), RiderController.updateRider);
router.post('/:id/suspend', requirePermission('riders.write'), RiderController.suspendRider);
router.post('/:id/activate', requirePermission('riders.write'), RiderController.activateRider);
router.post('/:id/block', requirePermission('riders.write'), RiderController.blockRider);

export { router as ridersRoutes };
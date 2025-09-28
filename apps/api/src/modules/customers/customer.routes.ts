import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';

const router = Router();

// Push token routes
router.patch('/push-token', authGuard({ requiredRoles: ['CUSTOMER'] }), CustomerController.updatePushToken);
router.get('/push-token', authGuard({ requiredRoles: ['CUSTOMER'] } ), CustomerController.getPushToken);

export default router;
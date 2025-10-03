import { Router } from 'express';
import { payoutsController } from './payouts.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';
import { validateRequest } from '../../../middlewares/validateRequest.js';
import { createPayoutValidation, updatePayoutValidation, payoutsListValidation, walletsListValidation, payoutDetailsValidation } from '../../../validations/admin/payouts.js';

const router = Router();

// All routes require authentication and payouts.read permission
router.use(authGuard());

// Get payouts list
router.get('/', requirePermission('payouts.read'), validateRequest(payoutsListValidation), payoutsController.getPayoutsList);

// Get wallets list
router.get('/wallets', requirePermission('payouts.read'), validateRequest(walletsListValidation), payoutsController.getWalletsList);

// Create payout
router.post('/', requirePermission('payouts.create'), validateRequest(createPayoutValidation), payoutsController.createPayout);

// Get payout details
router.get('/:id', requirePermission('payouts.read'), validateRequest(payoutDetailsValidation), payoutsController.getPayoutDetails);

// Update payout
router.put('/:id', requirePermission('payouts.update'), validateRequest(updatePayoutValidation), payoutsController.updatePayout);

export default router;
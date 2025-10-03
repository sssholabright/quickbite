import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';
import { validateRequest } from '../../../middlewares/validateRequest.js';
import { processRefundValidation, retryPaymentValidation, paymentsListValidation, paymentDetailsValidation } from '../../../validations/admin/payments.js';

const router = Router();

// All routes require authentication and payments.read permission
router.use(authGuard());

// Get payments list
router.get('/', requirePermission('payments.read'), validateRequest(paymentsListValidation), paymentsController.getPaymentsList);

// Get payment details
router.get('/:id', requirePermission('payments.read'), validateRequest(paymentDetailsValidation), paymentsController.getPaymentDetails);

// Process refund
router.post('/:id/refund', requirePermission('payments.refund'), validateRequest(processRefundValidation), paymentsController.processRefund);

// Retry payment
router.post('/:id/retry', requirePermission('payments.retry'), validateRequest(retryPaymentValidation), paymentsController.retryPayment);

export default router;
import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';
import { validateRequest } from '../../../middlewares/validateRequest.js';
import { updateCustomerValidation, suspendCustomerValidation, blockCustomerValidation, customersListValidation, customerDetailsValidation, customerOrderHistoryValidation } from '../../../validations/admin/customers.js';

const router = Router();

// All routes require authentication and customers.read permission
router.use(authGuard());

// Get customers list
router.get('/', requirePermission('customers.read'), validateRequest(customersListValidation), customersController.getCustomersList);

// Get customer details
router.get('/:id', requirePermission('customers.read'), validateRequest(customerDetailsValidation), customersController.getCustomerDetails);

// Update customer
router.put('/:id', requirePermission('customers.write'), validateRequest(updateCustomerValidation), customersController.updateCustomer);

// Suspend customer
router.post('/:id/suspend', requirePermission('customers.suspend'), validateRequest(suspendCustomerValidation), customersController.suspendCustomer);

// Block customer
router.post('/:id/block', requirePermission('customers.block'), validateRequest(blockCustomerValidation), customersController.blockCustomer);

// Activate customer
router.post('/:id/activate', requirePermission('customers.write'), customersController.activateCustomer);

// Get customer order history
router.get('/:id/orders', requirePermission('customers.read'), validateRequest(customerOrderHistoryValidation), customersController.getCustomerOrderHistory);

export default router;
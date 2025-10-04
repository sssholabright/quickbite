import { Router } from 'express';
import { vendorsController } from './vendors.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';
import { createVendorValidation, vendorDetailsValidation, vendorsListValidation, updateVendorValidation, updateVendorLocationValidation, suspendVendorValidation, rejectVendorValidation, blockVendorValidation } from '../../../validations/admin/vendors.js';
import { validateRequest } from '../../../middlewares/validateRequest.js';
import { uploadSingleImage, handleUploadError } from '../../../middlewares/upload.middleware.js';
import { fileUploadRateLimit } from '../../../middlewares/rateLimiter.js';

const router = Router();

// All routes require authentication and vendors.read permission
router.use(authGuard());

// Get vendors list
router.get('/', requirePermission('vendors.read'), validateRequest(vendorsListValidation), vendorsController.getVendorsList);

// Get vendor details
router.get('/:id', requirePermission('vendors.read'), validateRequest(vendorDetailsValidation), vendorsController.getVendorDetails);

// Create vendor with logo upload support
router.post('/', 
    fileUploadRateLimit,
    uploadSingleImage,
    handleUploadError,
    requirePermission('vendors.write'), 
    validateRequest(createVendorValidation), 
    vendorsController.createVendor
);

// Update vendor with logo upload support
router.put('/:id', 
    fileUploadRateLimit,
    uploadSingleImage,
    handleUploadError,
    requirePermission('vendors.write'), 
    validateRequest(updateVendorValidation), 
    vendorsController.updateVendor
);

// Update vendor location
router.patch('/:id/location', requirePermission('vendors.write'), validateRequest(updateVendorLocationValidation), vendorsController.updateVendorLocation);

// Approve vendor
router.post('/:id/approve', requirePermission('vendors.approve'), vendorsController.approveVendor);

// Suspend vendor
router.post('/:id/suspend', requirePermission('vendors.suspend'), validateRequest(suspendVendorValidation), vendorsController.suspendVendor);

// Reject vendor
router.post('/:id/reject', requirePermission('vendors.approve'), validateRequest(rejectVendorValidation), vendorsController.rejectVendor);   

// Block vendor
router.post('/:id/block', requirePermission('vendors.block'), validateRequest(blockVendorValidation), vendorsController.blockVendor);

// Activate vendor
router.post('/:id/activate', requirePermission('vendors.write'), vendorsController.activateVendor);

// Update vendor open status
router.post('/:id/update-status', requirePermission('vendors.write'), vendorsController.updateVendorOpenStatus);

export default router;
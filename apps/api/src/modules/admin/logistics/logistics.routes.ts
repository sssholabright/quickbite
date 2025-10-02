import { Router } from 'express';
import { LogisticsController } from './logistics.controller.js';
import { authGuard } from '../../../middlewares/authGuard.js';
import { requirePermission } from '../../../middlewares/adminPermission.js';

const router = Router();
router.use(authGuard());

// Logistics companies routes
router.get('/companies', requirePermission('logistics.read'), LogisticsController.getCompaniesList);
router.get('/companies/:id', requirePermission('logistics.read'), LogisticsController.getCompanyDetails);
router.post('/companies', requirePermission('logistics.write'), LogisticsController.createCompany);
router.put('/companies/:id', requirePermission('logistics.write'), LogisticsController.updateCompany);
router.post('/companies/:id/suspend', requirePermission('logistics.write'), LogisticsController.suspendCompany);
router.post('/companies/:id/activate', requirePermission('logistics.write'), LogisticsController.activateCompany);
router.post('/companies/:id/block', requirePermission('logistics.write'), LogisticsController.blockCompany);

export { router as logisticsRoutes };
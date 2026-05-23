import { Router } from 'express';
import {
  dashboard,
  employeeReport,
  callReport,
  campaignReport,
  conversionReport,
  exportEmployeeReport,
  employeePerformanceDetail,
} from '../controllers/reportController.js';
import { authenticate, scopeToEmployee, managerOrSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, scopeToEmployee);

router.get('/dashboard', dashboard);
router.get('/employees', managerOrSuperAdmin, employeeReport);
router.get('/employees/export', managerOrSuperAdmin, exportEmployeeReport);
router.get('/employees/:id/performance', employeePerformanceDetail);
router.get('/calls', managerOrSuperAdmin, callReport);
router.get('/campaigns', managerOrSuperAdmin, campaignReport);
router.get('/conversions', managerOrSuperAdmin, conversionReport);

export default router;

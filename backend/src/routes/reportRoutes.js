import { Router } from 'express';
import {
  dashboard,
  employeeReport,
  callReport,
  campaignReport,
  conversionReport,
  exportEmployeeReport,
} from '../controllers/reportController.js';
import { authenticate, scopeToEmployee } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, scopeToEmployee);

router.get('/dashboard', dashboard);
router.get('/employees', employeeReport);
router.get('/employees/export', exportEmployeeReport);
router.get('/calls', callReport);
router.get('/campaigns', campaignReport);
router.get('/conversions', conversionReport);

export default router;

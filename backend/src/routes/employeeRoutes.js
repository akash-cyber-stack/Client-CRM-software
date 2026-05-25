import { Router } from 'express';
import {
  listEmployees,
  createEmployee,
  importEmployees,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('SUPER_ADMIN', 'MANAGER'), listEmployees);
router.post('/', authorize('SUPER_ADMIN'), createEmployee);
router.post('/import', authorize('SUPER_ADMIN'), importEmployees);
router.put('/:id', authorize('SUPER_ADMIN'), updateEmployee);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteEmployee);

export default router;

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/companyController.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, authorize('SUPER_ADMIN'), updateMe);

export default router;

import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  createOrReplaceSuperAdmin,
  listUsersForPromotion,
} from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

router.get('/', getSettings);
router.put('/', updateSettings);

router.get('/users-for-promotion', authorize('SUPER_ADMIN'), listUsersForPromotion);
router.post('/super-admin', authorize('SUPER_ADMIN'), createOrReplaceSuperAdmin);

export default router;

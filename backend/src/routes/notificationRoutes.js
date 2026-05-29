import { Router } from 'express';
import {
  listNotifications,
  poll,
  readNotification,
  readAllNotifications,
  broadcastNotice,
  shareReport,
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/poll', poll);
router.post('/broadcast', authorize('SUPER_ADMIN'), broadcastNotice);
router.post('/share-report', authorize('SUPER_ADMIN', 'MANAGER'), shareReport);
router.patch('/:id/read', readNotification);
router.patch('/read-all', readAllNotifications);

export default router;

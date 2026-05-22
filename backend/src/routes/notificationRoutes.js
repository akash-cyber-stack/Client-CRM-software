import { Router } from 'express';
import {
  listNotifications,
  poll,
  readNotification,
  readAllNotifications,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/poll', poll);
router.patch('/:id/read', readNotification);
router.patch('/read-all', readAllNotifications);

export default router;

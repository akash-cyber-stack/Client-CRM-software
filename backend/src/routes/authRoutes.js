import { Router } from 'express';
import { login, me, logout, register, setupStatus } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/setup-status', setupStatus);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;

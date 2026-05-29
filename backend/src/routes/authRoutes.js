import { Router } from 'express';
import {
  login,
  me,
  logout,
  register,
  setupStatus,
  updateProfile,
  oauthProviders,
  oauthStart,
  oauthCallback,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/setup-status', setupStatus);
router.get('/oauth/providers', oauthProviders);
router.get('/oauth/:provider', oauthStart);
router.get('/oauth/:provider/callback', oauthCallback);
router.post('/email-otp/send', sendEmailOtp);
router.post('/email-otp/verify', verifyEmailOtp);
router.post('/phone-otp/send', optionalAuthenticate, sendPhoneOtp);
router.post('/phone-otp/verify', verifyPhoneOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;

import { Router } from 'express';
import { googleLeads, metaLeads, ivrCallCompleted } from '../controllers/webhookController.js';
import { verifyGoogleWebhook, verifyMetaWebhook, verifyIvrWebhook } from '../middleware/webhookAuth.js';

const router = Router();

router.post('/google-leads', verifyGoogleWebhook, googleLeads);
router.post('/meta-leads', verifyMetaWebhook, metaLeads);
router.get('/meta-leads', metaLeads);
router.post('/ivr-call-completed', verifyIvrWebhook, ivrCallCompleted);

export default router;

import { Router } from 'express';
import { googleLeads, metaLeads, ivrCallCompleted } from '../controllers/webhookController.js';
import { verifyGoogleWebhook, verifyMetaWebhook, verifyIvrWebhook } from '../middleware/webhookAuth.js';
import { resolveWebhookCompany } from '../middleware/webhookCompany.js';

const router = Router();

router.use(resolveWebhookCompany);

router.post('/google-leads', verifyGoogleWebhook, googleLeads);
router.post('/meta-leads', verifyMetaWebhook, metaLeads);
router.get('/meta-leads', verifyMetaWebhook, metaLeads);
router.post('/ivr-call-completed', verifyIvrWebhook, ivrCallCompleted);

export default router;

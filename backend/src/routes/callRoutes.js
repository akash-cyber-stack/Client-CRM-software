import { Router } from 'express';
import {
  listCalls,
  getCall,
  getCallsByEmployee,
  getCallsByLead,
  initiateCall,
} from '../controllers/callController.js';
import { authenticate, scopeToEmployee } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, scopeToEmployee);

router.post('/initiate', initiateCall);
router.get('/', listCalls);
router.get('/employee/:employeeId', getCallsByEmployee);
router.get('/lead/:leadId', getCallsByLead);
router.get('/:id', getCall);

export default router;

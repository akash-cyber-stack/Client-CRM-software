import { Router } from 'express';
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  addNote,
  addFollowUp,
} from '../controllers/leadController.js';
import { authenticate, authorize, scopeToEmployee } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, scopeToEmployee);

router.get('/', listLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', authorize('SUPER_ADMIN', 'MANAGER'), deleteLead);
router.post('/:id/assign', authorize('SUPER_ADMIN', 'MANAGER'), assignLead);
router.post('/:id/notes', addNote);
router.post('/:id/follow-up', addFollowUp);

export default router;

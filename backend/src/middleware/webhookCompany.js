import { getCompanyById } from '../services/companyService.js';
import { hasWorkspaceAccess } from '../utils/subscriptionAccess.js';

/** Webhooks: ?companyId=UUID or header X-Company-Id */
export const resolveWebhookCompany = async (req, res, next) => {
  const companyId = req.query.companyId || req.headers['x-company-id'];
  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: 'Company ID required. Add ?companyId=YOUR_COMPANY_ID to the webhook URL (see Settings).',
    });
  }

  const company = await getCompanyById(companyId);
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  if (!hasWorkspaceAccess(company) || company.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: 'Company subscription is not active' });
  }

  req.companyId = company.id;
  next();
};

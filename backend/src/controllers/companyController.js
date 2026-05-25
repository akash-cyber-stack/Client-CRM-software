import { asyncHandler } from '../utils/asyncHandler.js';
import { getCompanyProfile, updateCompanyProfile } from '../services/companyService.js';
import { getPlan } from '../constants/plans.js';

export const getMe = asyncHandler(async (req, res) => {
  const company = await getCompanyProfile(req.companyId);
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.json({
    success: true,
    data: { ...company, planDetails: getPlan(company.plan) },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const company = await updateCompanyProfile(req.companyId, req.body);
  res.json({ success: true, message: 'Company profile updated', data: company });
});

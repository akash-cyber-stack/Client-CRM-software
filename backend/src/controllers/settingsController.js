import { asyncHandler } from '../utils/asyncHandler.js';
import { getAllSettings, upsertSettings } from '../services/settingsService.js';
import { assignSuperAdmin, getSuperAdmin } from '../services/superAdminService.js';
import prisma from '../config/db.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getAllSettings(req.companyId);
  const superAdmin = await getSuperAdmin(req.companyId);
  res.json({
    success: true,
    data: {
      ...settings,
      superAdmin: superAdmin || null,
      hasSuperAdmin: !!superAdmin,
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { superAdmin: _sa, hasSuperAdmin: _h, ...settingsBody } = req.body;
  const settings = await upsertSettings(req.companyId, settingsBody);
  const superAdmin = await getSuperAdmin(req.companyId);
  res.json({
    success: true,
    data: { ...settings, superAdmin, hasSuperAdmin: !!superAdmin },
  });
});

export const createOrReplaceSuperAdmin = asyncHandler(async (req, res) => {
  const { userId, email, name, phone, password } = req.body;

  if (!userId && (!email || !name || !password)) {
    return res.status(400).json({
      success: false,
      message: 'Provide userId to promote, or email + name + password for new Super Admin',
    });
  }

  const user = await assignSuperAdmin(req.companyId, { userId, email, name, phone, password });

  res.json({
    success: true,
    message: 'Super Admin updated. Previous Super Admin is now Manager.',
    data: user,
  });
});

export const listUsersForPromotion = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.companyId, role: { not: 'SUPER_ADMIN' }, status: 'ACTIVE' },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: users });
});

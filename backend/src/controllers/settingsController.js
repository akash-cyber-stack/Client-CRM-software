import { asyncHandler } from '../utils/asyncHandler.js';
import { getAllSettings, upsertSettings } from '../services/settingsService.js';
import { assignSuperAdmin, getSuperAdmin, hasSuperAdmin } from '../services/superAdminService.js';
import prisma from '../config/db.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getAllSettings();
  const superAdmin = await getSuperAdmin();
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
  const settings = await upsertSettings(settingsBody);
  const superAdmin = await getSuperAdmin();
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

  const user = await assignSuperAdmin({ userId, email, name, phone, password }, req.user.id);

  res.json({
    success: true,
    message: 'Super Admin updated. Previous Super Admin is now Manager.',
    data: user,
  });
});

export const listUsersForPromotion = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { not: 'SUPER_ADMIN' }, status: 'ACTIVE' },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: users });
});

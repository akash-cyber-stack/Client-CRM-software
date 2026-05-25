import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listFollowUps = asyncHandler(async (req, res) => {
  const { type, employeeId } = req.query;
  const scopeId = req.employeeScopeId;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const where = {
    isCompleted: false,
    lead: { companyId: req.companyId },
    ...(scopeId ? { employeeId: scopeId } : employeeId ? { employeeId } : {}),
  };

  if (type === 'today') {
    where.scheduledAt = { gte: todayStart, lt: todayEnd };
  } else if (type === 'pending') {
    where.scheduledAt = { gte: now };
  } else if (type === 'missed') {
    where.scheduledAt = { lt: now };
  }

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      lead: {
        select: {
          id: true,
          customerName: true,
          phone: true,
          status: true,
          source: true,
          leadNumber: true,
        },
      },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  res.json({ success: true, data: followUps });
});

export const completeFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Follow-up not found' });
  }
  if (req.employeeScopeId && existing.employeeId !== req.employeeScopeId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const followUp = await prisma.followUp.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
  });
  res.json({ success: true, data: followUp });
});

export const followUpDashboard = asyncHandler(async (req, res) => {
  const scopeId = req.employeeScopeId;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const baseWhere = scopeId ? { employeeId: scopeId } : {};

  const [today, pending, missed, byEmployee] = await Promise.all([
    prisma.followUp.count({
      where: {
        ...baseWhere,
        isCompleted: false,
        scheduledAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.followUp.count({
      where: { ...baseWhere, isCompleted: false, scheduledAt: { gte: now } },
    }),
    prisma.followUp.count({
      where: { ...baseWhere, isCompleted: false, scheduledAt: { lt: now } },
    }),
    scopeId
      ? null
      : prisma.user.findMany({
          where: { role: 'SALES_EMPLOYEE', status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            followUps: {
              where: { isCompleted: false },
              select: { id: true, scheduledAt: true },
            },
          },
        }),
  ]);

  res.json({
    success: true,
    data: { today, pending, missed, byEmployee },
  });
});

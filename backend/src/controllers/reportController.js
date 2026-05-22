import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function dateFilter(query) {
  const filter = {};
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.lte = new Date(query.toDate);
  }
  return filter;
}

export const dashboard = asyncHandler(async (req, res) => {
  const scopeId = req.employeeScopeId;
  const leadWhere = scopeId ? { assignedToId: scopeId } : {};
  const callWhere = scopeId ? { employeeId: scopeId } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalLeads,
    newLeads,
    convertedLeads,
    lostLeads,
    todayFollowUps,
    totalCalls,
    answeredCalls,
    missedCalls,
    sourceBreakdown,
    campaignBreakdown,
    employeePerformance,
    myPendingLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: 'NEW' } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'CONVERTED' } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'LOST' } }),
    prisma.followUp.count({
      where: {
        ...(scopeId ? { employeeId: scopeId } : {}),
        scheduledAt: { gte: today, lt: tomorrow },
        isCompleted: false,
      },
    }),
    prisma.callLog.count({ where: callWhere }),
    prisma.callLog.count({ where: { ...callWhere, callStatus: 'ANSWERED' } }),
    prisma.callLog.count({ where: { ...callWhere, callStatus: 'MISSED' } }),
    prisma.lead.groupBy({ by: ['source'], where: leadWhere, _count: true }),
    prisma.lead.groupBy({
      by: ['campaignName'],
      where: { ...leadWhere, campaignName: { not: null } },
      _count: true,
    }),
    scopeId
      ? null
      : prisma.user.findMany({
          where: { role: 'SALES_EMPLOYEE' },
          select: {
            id: true,
            name: true,
            _count: { select: { assignedLeads: true, callLogs: true } },
          },
        }),
    scopeId
      ? prisma.lead.count({
          where: {
            assignedToId: scopeId,
            status: { in: ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
          },
        })
      : null,
  ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 10000) / 100 : 0;

  res.json({
    success: true,
    data: {
      totalLeads,
      newLeads,
      convertedLeads,
      lostLeads,
      todayFollowUps,
      totalCalls,
      answeredCalls,
      missedCalls,
      conversionRate,
      sourceBreakdown: sourceBreakdown.map((s) => ({ source: s.source, count: s._count })),
      campaignBreakdown: campaignBreakdown
        .filter((c) => c.campaignName)
        .map((c) => ({ campaign: c.campaignName, count: c._count })),
      employeePerformance: employeePerformance?.map((e) => ({
        id: e.id,
        name: e.name,
        leads: e._count.assignedLeads,
        calls: e._count.callLogs,
      })),
      myPendingLeads,
      myAssignedLeads: scopeId ? totalLeads : undefined,
    },
  });
});

export const employeeReport = asyncHandler(async (req, res) => {
  const dateF = dateFilter(req.query);
  const employees = await prisma.user.findMany({
    where: {
      role: { in: ['SALES_EMPLOYEE', 'MANAGER'] },
      ...(req.query.employeeId ? { id: req.query.employeeId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      assignedLeads: {
        where: dateF,
        select: { id: true, status: true, source: true, createdAt: true },
      },
      callLogs: {
        where: req.query.fromDate
          ? { callStartTime: { gte: new Date(req.query.fromDate), lte: req.query.toDate ? new Date(req.query.toDate) : undefined } }
          : {},
        select: { id: true, callStatus: true, durationSeconds: true, recordingUrl: true },
      },
    },
  });

  res.json({ success: true, data: employees });
});

export const callReport = asyncHandler(async (req, res) => {
  const where = {};
  if (req.employeeScopeId) where.employeeId = req.employeeScopeId;
  if (req.query.employeeId) where.employeeId = req.query.employeeId;
  if (req.query.fromDate || req.query.toDate) {
    where.callStartTime = {};
    if (req.query.fromDate) where.callStartTime.gte = new Date(req.query.fromDate);
    if (req.query.toDate) where.callStartTime.lte = new Date(req.query.toDate);
  }

  const calls = await prisma.callLog.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true } },
      lead: { select: { id: true, customerName: true, source: true } },
    },
    orderBy: { callStartTime: 'desc' },
  });

  res.json({ success: true, data: calls });
});

export const campaignReport = asyncHandler(async (req, res) => {
  const where = dateFilter(req.query);
  if (req.query.source) where.source = req.query.source;

  const campaigns = await prisma.lead.groupBy({
    by: ['campaignName', 'source'],
    where: { ...where, campaignName: { not: null } },
    _count: true,
  });

  res.json({
    success: true,
    data: campaigns.map((c) => ({
      campaign: c.campaignName,
      source: c.source,
      count: c._count,
    })),
  });
});

export const conversionReport = asyncHandler(async (req, res) => {
  const where = dateFilter(req.query);
  if (req.query.source) where.source = req.query.source;
  if (req.employeeScopeId) where.assignedToId = req.employeeScopeId;
  if (req.query.employeeId) where.assignedToId = req.query.employeeId;

  const byStatus = await prisma.lead.groupBy({
    by: ['status'],
    where,
    _count: true,
  });

  const total = byStatus.reduce((s, x) => s + x._count, 0);
  const converted = byStatus.find((x) => x.status === 'CONVERTED')?._count || 0;

  res.json({
    success: true,
    data: {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      total,
      converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 10000) / 100 : 0,
    },
  });
});

/** Export helper - returns CSV string */
export const exportCsv = (rows, headers) => {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
};

export const exportEmployeeReport = asyncHandler(async (req, res) => {
  const employees = await prisma.user.findMany({
    where: { role: 'SALES_EMPLOYEE' },
    include: { _count: { select: { assignedLeads: true, callLogs: true } } },
  });
  const rows = employees.map((e) => ({
    name: e.name,
    email: e.email,
    leads: e._count.assignedLeads,
    calls: e._count.callLogs,
    status: e.status,
  }));
  const csv = exportCsv(rows, ['name', 'email', 'leads', 'calls', 'status']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=employee-report.csv');
  res.send(csv);
});

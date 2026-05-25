import prisma from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Roles that appear in performance charts / detail (not Super Admin) */
const PERFORMANCE_ROLES = ['SALES_EMPLOYEE', 'MANAGER'];

/** Leads captured via ad platforms (not Excel / manual import). */
const AD_LEAD_SOURCES = ['GOOGLE_ADS', 'META_ADS'];

function dateFilter(query) {
  const filter = {};
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.lte = new Date(query.toDate);
  }
  return filter;
}

function leadWhereForReq(req, extra = {}) {
  const where = { companyId: req.companyId, ...extra };
  if (req.employeeScopeId) where.assignedToId = req.employeeScopeId;
  return where;
}

export const dashboard = asyncHandler(async (req, res) => {
  const scopeId = req.employeeScopeId;
  const leadWhere = leadWhereForReq(req);

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
    nonCampaignLeadsCount,
    employeePerformance,
    myPendingLeads,
    statusBreakdown,
    leadsLast7Days,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: 'NEW' } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'CONVERTED' } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'LOST' } }),
    prisma.followUp.count({
      where: {
        ...(scopeId ? { employeeId: scopeId } : {}),
        lead: { companyId: req.companyId },
        scheduledAt: { gte: today, lt: tomorrow },
        isCompleted: false,
      },
    }),
    scopeId
      ? Promise.resolve(0)
      : prisma.callLog.count({ where: { companyId: req.companyId } }),
    scopeId
      ? Promise.resolve(0)
      : prisma.callLog.count({ where: { companyId: req.companyId, callStatus: 'ANSWERED' } }),
    scopeId
      ? Promise.resolve(0)
      : prisma.callLog.count({ where: { companyId: req.companyId, callStatus: 'MISSED' } }),
    prisma.lead.groupBy({ by: ['source'], where: leadWhere, _count: true }),
    prisma.lead.groupBy({
      by: ['campaignName'],
      where: {
        ...leadWhere,
        source: { in: AD_LEAD_SOURCES },
        campaignName: { not: null },
      },
      _count: true,
    }),
    prisma.lead.count({
      where: { ...leadWhere, source: 'MANUAL' },
    }),
    scopeId
      ? null
      : prisma.user.findMany({
          where: { companyId: req.companyId, role: { in: PERFORMANCE_ROLES } },
          select: {
            id: true,
            name: true,
            _count: { select: { assignedLeads: true, callLogs: true } },
          },
          orderBy: { name: 'asc' },
        }),
    scopeId
      ? prisma.lead.count({
          where: {
            companyId: req.companyId,
            assignedToId: scopeId,
            status: { in: ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
          },
        })
      : null,
    prisma.lead.groupBy({ by: ['status'], where: leadWhere, _count: true }),
    (async () => {
      const dayRanges = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        dayRanges.push({ d, next });
      }
      const counts = await Promise.all(
        dayRanges.map(({ d, next }) =>
          prisma.lead.count({
            where: { ...leadWhere, createdAt: { gte: d, lt: next } },
          })
        )
      );
      return dayRanges.map(({ d }, idx) => ({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        count: counts[idx],
      }));
    })(),
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
      nonCampaignLeadsCount,
      employeePerformance: employeePerformance?.map((e) => ({
        id: e.id,
        name: e.name,
        leads: e._count.assignedLeads,
        calls: e._count.callLogs,
      })),
      myPendingLeads,
      myAssignedLeads: scopeId ? totalLeads : undefined,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
      leadsLast7Days,
      callBreakdown: [
        { name: 'Answered', value: answeredCalls, key: 'ANSWERED' },
        { name: 'Missed', value: missedCalls, key: 'MISSED' },
        { name: 'Other', value: Math.max(0, totalCalls - answeredCalls - missedCalls), key: 'OTHER' },
      ].filter((c) => c.value > 0 || !scopeId),
    },
  });
});

export const employeeReport = asyncHandler(async (req, res) => {
  const dateF = dateFilter(req.query);
  const employees = await prisma.user.findMany({
    where: {
      companyId: req.companyId,
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
        select: {
          id: true,
          customerName: true,
          phone: true,
          status: true,
          source: true,
          createdAt: true,
        },
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
  const where = { companyId: req.companyId };
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
  const where = { companyId: req.companyId, ...dateFilter(req.query) };
  if (req.query.source) {
    where.source = req.query.source;
  } else {
    where.source = { in: AD_LEAD_SOURCES };
  }

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
  const where = { companyId: req.companyId, ...dateFilter(req.query) };
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

function parseDayRange(dateStr) {
  const day = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  day.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { day, dayEnd };
}

function parseMonthRange(monthStr) {
  const [y, m] = (monthStr || '').split('-').map(Number);
  const start = monthStr && y && m
    ? new Date(y, m - 1, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end, label: `${start.toLocaleString('en', { month: 'long' })} ${start.getFullYear()}` };
}

function summarizeLeads(leads) {
  const completed = leads.filter((l) => l.status === 'CONVERTED').length;
  const lost = leads.filter((l) => ['NOT_INTERESTED', 'LOST'].includes(l.status)).length;
  const incomplete = leads.filter(
    (l) => !['CONVERTED', 'NOT_INTERESTED', 'LOST'].includes(l.status)
  ).length;
  return { total: leads.length, completed, incomplete, lost };
}

function summarizeCalls(calls) {
  return {
    total: calls.length,
    received: calls.filter((c) => c.callStatus === 'ANSWERED').length,
    missed: calls.filter((c) => c.callStatus === 'MISSED' || c.callType === 'MISSED').length,
    rejected: calls.filter((c) => ['FAILED', 'BUSY'].includes(c.callStatus)).length,
    outgoing: calls.filter((c) => c.callType === 'OUTGOING').length,
    incoming: calls.filter((c) => c.callType === 'INCOMING').length,
  };
}

/** Detailed daily + monthly performance for one employee */
export const employeePerformanceDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.employeeScopeId && req.employeeScopeId !== id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const employee = await prisma.user.findFirst({
    where: { id, companyId: req.companyId, role: { in: PERFORMANCE_ROLES } },
    select: { id: true, name: true, email: true, role: true, department: true, phone: true },
  });
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const { day, dayEnd } = parseDayRange(req.query.date);
  const { start: monthStart, end: monthEnd, label: monthLabel } = parseMonthRange(req.query.month);

  const leadDayWhere = {
    companyId: req.companyId,
    assignedToId: id,
    OR: [
      { createdAt: { gte: day, lt: dayEnd } },
      { updatedAt: { gte: day, lt: dayEnd } },
    ],
  };

  const leadMonthWhere = {
    companyId: req.companyId,
    assignedToId: id,
    OR: [
      { createdAt: { gte: monthStart, lt: monthEnd } },
      { updatedAt: { gte: monthStart, lt: monthEnd } },
    ],
  };

  const [dailyLeads, dailyCalls, monthlyLeads, monthlyCalls, followUpsMonth] = await Promise.all([
    prisma.lead.findMany({
      where: leadDayWhere,
      select: { id: true, customerName: true, phone: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.callLog.findMany({
      where: { companyId: req.companyId, employeeId: id, callStartTime: { gte: day, lt: dayEnd } },
      select: {
        id: true,
        callType: true,
        callStatus: true,
        durationSeconds: true,
        callStartTime: true,
        customerPhone: true,
        lead: { select: { id: true, customerName: true } },
      },
      orderBy: { callStartTime: 'desc' },
    }),
    prisma.lead.findMany({
      where: leadMonthWhere,
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.callLog.findMany({
      where: { companyId: req.companyId, employeeId: id, callStartTime: { gte: monthStart, lt: monthEnd } },
      select: { callStatus: true, callType: true },
    }),
    prisma.followUp.findMany({
      where: {
        employeeId: id,
        lead: { companyId: req.companyId },
        scheduledAt: { gte: monthStart, lt: monthEnd },
      },
      select: { isCompleted: true },
    }),
  ]);

  const dailyLeadStats = summarizeLeads(dailyLeads);
  const dailyCallStats = summarizeCalls(dailyCalls);
  const monthlyLeadStats = summarizeLeads(monthlyLeads);
  const monthlyCallStats = summarizeCalls(monthlyCalls);

  const followUpsDone = followUpsMonth.filter((f) => f.isCompleted).length;
  const followUpsPending = followUpsMonth.length - followUpsDone;

  const leadsByStatus = await prisma.lead.groupBy({
    by: ['status'],
    where: { companyId: req.companyId, assignedToId: id, createdAt: { gte: monthStart, lt: monthEnd } },
    _count: true,
  });

  res.json({
    success: true,
    data: {
      employee,
      selectedDate: day.toISOString().slice(0, 10),
      daily: {
        leads: dailyLeadStats,
        calls: dailyCallStats,
        leadList: dailyLeads,
        callList: dailyCalls,
      },
      monthly: {
        monthLabel,
        monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        leads: monthlyLeadStats,
        calls: monthlyCallStats,
        followUps: { total: followUpsMonth.length, completed: followUpsDone, pending: followUpsPending },
        conversionRate:
          monthlyLeadStats.total > 0
            ? Math.round((monthlyLeadStats.completed / monthlyLeadStats.total) * 10000) / 100
            : 0,
        leadsByStatus: leadsByStatus.map((r) => ({ status: r.status, count: r._count })),
      },
    },
  });
});

export const exportEmployeeReport = asyncHandler(async (req, res) => {
  const employees = await prisma.user.findMany({
    where: { companyId: req.companyId, role: { in: PERFORMANCE_ROLES } },
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

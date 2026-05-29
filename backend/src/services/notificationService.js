import prisma from '../config/db.js';
import { planHasEmailAlerts } from '../constants/planFeatures.js';
import { dispatchNotificationEmail } from './notificationEmailService.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  leadId,
  callId,
  emailFrom,
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, leadId, callId },
  });

  if (emailFrom) {
    dispatchNotificationEmail(notification, emailFrom).catch(() => {});
  }

  return notification;
}

/** Super Admin / Manager: in-app notice + email (Professional & Enterprise). */
export async function broadcastTeamNotice({
  companyId,
  sender,
  title,
  message,
  userIds,
  type = 'ADMIN_NOTICE',
}) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, plan: true },
  });

  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 });
  }

  if (!planHasEmailAlerts(company.plan)) {
    throw Object.assign(
      new Error(
        'Email alerts are available on Professional and Enterprise plans. Upgrade to notify your team by email.'
      ),
      { statusCode: 403, code: 'PLAN_EMAIL_ALERTS' }
    );
  }

  const where = {
    companyId,
    status: 'ACTIVE',
    role: { not: 'SUPER_ADMIN' },
  };
  if (userIds?.length) {
    where.id = { in: userIds };
  }

  const recipients = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true },
  });

  if (!recipients.length) {
    throw Object.assign(new Error('No recipients found'), { statusCode: 400 });
  }

  const emailFrom = { id: sender.id, name: sender.name, role: sender.role };
  const created = await Promise.all(
    recipients.map((r) =>
      createNotification({
        userId: r.id,
        type,
        title,
        message,
        emailFrom,
      })
    )
  );

  return {
    count: created.length,
    emailed: true,
    recipients: recipients.map((r) => ({ id: r.id, name: r.name, email: r.email })),
  };
}

export async function notifyTeamReport({
  companyId,
  sender,
  reportLabel,
  summary,
  userIds,
}) {
  const title = `Report shared: ${reportLabel}`;
  const message = summary
    ? `${sender.name} (${sender.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Manager'}) shared a report with you.\n\n${summary}`
    : `${sender.name} shared the ${reportLabel} report with you. Open the CRM to review.`;

  return broadcastTeamNotice({
    companyId,
    sender,
    title,
    message,
    userIds,
    type: 'REPORT_SHARED',
  });
}

const ADMIN_ASSIGN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

/** Notify assignee + managers when an admin/super-admin assigns a lead */
export async function notifyOnLeadAssignment({ lead, assigneeId, assignedBy }) {
  const emailFrom =
    assignedBy && ADMIN_ASSIGN_ROLES.includes(assignedBy.role)
      ? { id: assignedBy.id, name: assignedBy.name, role: assignedBy.role }
      : null;

  const assignerLabel =
    assignedBy?.role === 'SUPER_ADMIN'
      ? `Super Admin ${assignedBy.name}`
      : assignedBy?.name || 'Your admin';

  await createNotification({
    userId: assigneeId,
    type: 'LEAD_ASSIGNED',
    title: 'New lead assigned',
    message: emailFrom
      ? `${assignerLabel} assigned lead "${lead.customerName}" to you.`
      : `Lead ${lead.customerName} has been assigned to you.`,
    leadId: lead.id,
    emailFrom,
  });

  if (!assignedBy || !ADMIN_ASSIGN_ROLES.includes(assignedBy.role)) return;

  const assigneeName = lead.assignedTo?.name || 'a team member';
  const managers = await prisma.user.findMany({
    where: {
      companyId: lead.companyId,
      role: 'MANAGER',
      status: 'ACTIVE',
      id: { not: assigneeId },
    },
    select: { id: true },
  });

  await Promise.all(
    managers.map((m) =>
      createNotification({
        userId: m.id,
        type: 'LEAD_ASSIGNED',
        title: 'Lead assigned to team',
        message: `${assignedBy.name} assigned ${lead.customerName} to ${assigneeName}.`,
        leadId: lead.id,
        emailFrom,
      })
    )
  );
}

/** Avoid spam — skip if same type+lead (+title) exists within dedupeHours */
export async function createNotificationIfNew({
  userId,
  type,
  title,
  message,
  leadId,
  callId,
  dedupeHours = 24,
}) {
  const since = new Date(Date.now() - dedupeHours * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      title,
      ...(leadId ? { leadId } : {}),
      createdAt: { gte: since },
    },
  });
  if (existing) return null;
  return createNotification({ userId, type, title, message, leadId, callId });
}

export async function getUserNotifications(userId, { unreadOnly = false, limit = 50, since } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;
  if (since) where.createdAt = { gt: new Date(since) };

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function pollNotifications(userId, role, companyId, { since, runAutomation = true } = {}) {
  if (runAutomation && companyId) {
    const { runAutomationsForUser } = await import('./automationService.js');
    await runAutomationsForUser(userId, role, companyId);
  }

  const notifications = await getUserNotifications(userId, {
    since,
    limit: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markAsRead(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export function resolveNotificationPath(notification) {
  const { type, leadId, callId } = notification;
  if (leadId) {
    if (type === 'MISSED_FOLLOW_UP') return `/follow-ups?type=missed`;
    if (type === 'FOLLOW_UP_REMINDER') return `/leads/${leadId}`;
    return `/leads/${leadId}`;
  }
  if (callId) return `/calls`;
  if (type === 'MISSED_FOLLOW_UP') return '/follow-ups?type=missed';
  if (type === 'REPORT_SHARED') return '/reports';
  if (type === 'ADMIN_NOTICE') return '/settings';
  if (titleIncludes(notification, 'Unassigned')) return '/leads?status=NEW';
  return '/';
}

function titleIncludes(n, text) {
  return n.title?.toLowerCase().includes(text.toLowerCase());
}

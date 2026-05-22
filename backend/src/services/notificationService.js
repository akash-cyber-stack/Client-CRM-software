import prisma from '../config/db.js';

export async function createNotification({ userId, type, title, message, leadId, callId }) {
  return prisma.notification.create({
    data: { userId, type, title, message, leadId, callId },
  });
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

export async function pollNotifications(userId, role, { since, runAutomation = true } = {}) {
  if (runAutomation) {
    const { runAutomationsForUser } = await import('./automationService.js');
    await runAutomationsForUser(userId, role);
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
  if (titleIncludes(notification, 'Unassigned')) return '/leads?status=NEW';
  return '/';
}

function titleIncludes(n, text) {
  return n.title?.toLowerCase().includes(text.toLowerCase());
}

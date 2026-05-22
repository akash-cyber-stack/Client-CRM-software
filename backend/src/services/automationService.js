import prisma from '../config/db.js';
import { getSetting } from './settingsService.js';
import { createNotificationIfNew } from './notificationService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

async function isEnabled(key) {
  const v = await getSetting(key);
  return v !== 'false' && v !== '0';
}

/** Smart CRM automations — reduces manual follow-up work */
export async function runAutomationsForUser(userId, role) {
  const created = [];

  if (await isEnabled('automation_missed_followup')) {
    const missed = await prisma.followUp.findMany({
      where: {
        employeeId: userId,
        isCompleted: false,
        scheduledAt: { lt: new Date() },
      },
      include: { lead: { select: { id: true, customerName: true } } },
      take: 20,
    });

    for (const f of missed) {
      const n = await createNotificationIfNew({
        userId,
        type: 'MISSED_FOLLOW_UP',
        title: 'Missed follow-up',
        message: `Follow-up missed for ${f.lead.customerName}. Tap to open lead.`,
        leadId: f.leadId,
        dedupeHours: 24,
      });
      if (n) created.push(n);
    }
  }

  if (await isEnabled('automation_followup_reminder')) {
    const in2h = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const now = new Date();
    const upcoming = await prisma.followUp.findMany({
      where: {
        employeeId: userId,
        isCompleted: false,
        scheduledAt: { gte: now, lte: in2h },
      },
      include: { lead: { select: { id: true, customerName: true } } },
    });

    for (const f of upcoming) {
      const n = await createNotificationIfNew({
        userId,
        type: 'FOLLOW_UP_REMINDER',
        title: 'Follow-up due soon',
        message: `Reminder: ${f.lead.customerName} — ${new Date(f.scheduledAt).toLocaleString()}`,
        leadId: f.leadId,
        dedupeHours: 4,
      });
      if (n) created.push(n);
    }
  }

  if (await isEnabled('automation_stale_lead_enabled')) {
    const days = parseInt((await getSetting('automation_stale_lead_days')) || '3', 10);
    const cutoff = new Date(Date.now() - days * DAY_MS);

    const staleLeads = await prisma.lead.findMany({
      where: {
        assignedToId: userId,
        status: { in: ['NEW', 'ASSIGNED'] },
        updatedAt: { lt: cutoff },
        callLogs: { none: {} },
      },
      take: 15,
    });

    for (const lead of staleLeads) {
      const n = await createNotificationIfNew({
        userId,
        type: 'FOLLOW_UP_REMINDER',
        title: 'Stale lead — action needed',
        message: `${lead.customerName} has no calls for ${days}+ days. Contact now.`,
        leadId: lead.id,
        dedupeHours: 48,
      });
      if (n) created.push(n);
    }
  }

  // Managers/admins: notify when new unassigned leads exist (round-robin off)
  if (role === 'MANAGER' || role === 'SUPER_ADMIN') {
    if (await isEnabled('automation_unassigned_lead_alert')) {
      const unassigned = await prisma.lead.count({ where: { assignedToId: null, status: 'NEW' } });
      if (unassigned > 0) {
        const n = await createNotificationIfNew({
          userId,
          type: 'LEAD_ASSIGNED',
          title: 'Unassigned leads waiting',
          message: `${unassigned} new lead(s) need assignment. Open Leads page.`,
          dedupeHours: 12,
        });
        if (n) created.push(n);
      }
    }
  }

  return created;
}

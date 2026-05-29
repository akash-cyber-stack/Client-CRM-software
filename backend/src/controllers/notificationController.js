import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getUserNotifications,
  markAsRead,
  markAllRead,
  pollNotifications,
  resolveNotificationPath,
  broadcastTeamNotice,
  notifyTeamReport,
} from '../services/notificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await getUserNotifications(req.user.id, {
    unreadOnly: req.query.unread === 'true',
    limit: parseInt(req.query.limit || '50', 10),
  });
  const enriched = notifications.map((n) => ({
    ...n,
    path: resolveNotificationPath(n),
  }));
  res.json({ success: true, data: enriched });
});

export const poll = asyncHandler(async (req, res) => {
  const since = req.query.since;
  const result = await pollNotifications(req.user.id, req.user.role, req.companyId, { since });
  const enriched = result.notifications.map((n) => ({
    ...n,
    path: resolveNotificationPath(n),
  }));
  res.json({
    success: true,
    data: {
      notifications: enriched,
      unreadCount: result.unreadCount,
    },
  });
});

export const readNotification = asyncHandler(async (req, res) => {
  await markAsRead(req.params.id, req.user.id);
  res.json({ success: true, message: 'Marked as read' });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  await markAllRead(req.user.id);
  res.json({ success: true, message: 'All marked as read' });
});

export const broadcastNotice = asyncHandler(async (req, res) => {
  const { title, message, userIds } = req.body;
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required',
    });
  }

  const data = await broadcastTeamNotice({
    companyId: req.companyId,
    sender: req.user,
    title: String(title).trim(),
    message: String(message).trim(),
    userIds: Array.isArray(userIds) ? userIds : undefined,
  });

  res.json({
    success: true,
    message: `Notice sent to ${data.count} team member(s) with email delivery`,
    data,
  });
});

export const shareReport = asyncHandler(async (req, res) => {
  const { reportLabel, summary, userIds } = req.body;
  if (!reportLabel?.trim()) {
    return res.status(400).json({ success: false, message: 'reportLabel is required' });
  }

  const data = await notifyTeamReport({
    companyId: req.companyId,
    sender: req.user,
    reportLabel: String(reportLabel).trim(),
    summary: summary ? String(summary).trim() : '',
    userIds: Array.isArray(userIds) ? userIds : undefined,
  });

  res.json({
    success: true,
    message: `Report notification emailed to ${data.count} team member(s)`,
    data,
  });
});

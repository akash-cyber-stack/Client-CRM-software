import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getUserNotifications,
  markAsRead,
  markAllRead,
  pollNotifications,
  resolveNotificationPath,
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
  const result = await pollNotifications(req.user.id, req.user.role, { since });
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

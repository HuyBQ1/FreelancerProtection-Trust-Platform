import Notification from '../models/Notification.js';
import { serializeNotification } from '../services/notificationService.js';

export async function getNotifications(req, res) {
  const notifications = await Notification.find({
    recipientId: req.user._id,
    recipientRole: req.user.role,
  })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    recipientId: req.user._id,
    recipientRole: req.user.role,
    read: false,
  });

  res.status(200).json({
    message: 'Notifications fetched successfully',
    unreadCount,
    notifications: notifications.map(serializeNotification),
  });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.notificationId,
      recipientId: req.user._id,
      recipientRole: req.user.role,
    },
    { $set: { read: true } },
    { new: true },
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    message: 'Notification marked as read',
    notification: serializeNotification(notification),
  });
}

export async function markAllNotificationsRead(req, res) {
  await Notification.updateMany(
    {
      recipientId: req.user._id,
      recipientRole: req.user.role,
      read: false,
    },
    { $set: { read: true } },
  );

  res.status(200).json({
    message: 'All notifications marked as read',
  });
}

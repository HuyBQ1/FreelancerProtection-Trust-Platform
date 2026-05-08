import Notification from '../models/Notification.js';
import { emitToUser } from '../socket.js';

export function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    actionPage: notification.actionPage,
    actionId: notification.actionId,
    actorName: notification.actorName,
    actorRole: notification.actorRole,
    metadata: notification.metadata || {},
    createdAt: notification.createdAt,
  };
}

export async function createNotification({
  recipient,
  actor = null,
  type = 'system',
  title,
  body = '',
  actionPage = '',
  actionId = '',
  metadata = {},
}) {
  try {
    if (!recipient?._id || !recipient?.role || !title) {
      return null;
    }

    const notification = await Notification.create({
      recipientId: recipient._id,
      recipientRole: recipient.role,
      actorId: actor?._id || null,
      actorRole: actor?.role || '',
      actorName: actor?.fullName || actor?.email || '',
      type,
      title,
      body,
      actionPage,
      actionId: `${actionId || ''}`,
      metadata,
    });

    const serialized = serializeNotification(notification);
    emitToUser(recipient, 'notification:new', { notification: serialized });

    return serialized;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

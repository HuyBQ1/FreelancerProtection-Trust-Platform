import AuditLog from '../models/AuditLog.js';

export async function createAuditLog({ actor, action, entityType, entityId, metadata = {} }) {
  if (!actor?._id || !action || !entityType || !entityId) {
    return null;
  }

  return AuditLog.create({
    actorId: actor._id,
    actorRole: actor.role || '',
    action,
    entityType,
    entityId,
    metadata,
  });
}

from datetime import datetime, timezone
from typing import Any

from app.db.mongodb import audit_logs_collection


async def write_audit_log(actor_id: str, action: str, entity_type: str, entity_id: str, metadata: dict[str, Any] | None = None):
    await audit_logs_collection.insert_one(
        {
            "actorId": actor_id,
            "action": action,
            "entityType": entity_type,
            "entityId": entity_id,
            "metadata": metadata or {},
            "createdAt": datetime.now(timezone.utc),
        }
    )

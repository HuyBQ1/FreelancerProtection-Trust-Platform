from datetime import datetime, timezone

from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.auth.dependencies import CurrentUser
from app.db.mongodb import contracts_collection, disputes_collection, evidence_collection, responses_collection, audit_logs_collection
from app.schemas.disputes import DisputeCreate, DisputeStatus, DisputeStatusUpdate, EvidenceCreate, ResponseCreate
from app.services.audit_service import write_audit_log
from app.utils.object_id import object_id, serialize_id

ACTIVE_DISPUTE_STATUSES = [DisputeStatus.OPEN.value, DisputeStatus.WAITING_RESPONSE.value, DisputeStatus.UNDER_REVIEW.value]


async def freeze_escrow(contract_id: str, milestone_id: str | None = None):
    query = {"_id": object_id(contract_id, "contractId")}
    update = {"$set": {"escrowStatus": "LOCKED", "updatedAt": datetime.now(timezone.utc)}}
    if milestone_id:
        update["$set"][f"milestoneEscrowStatus.{milestone_id}"] = "LOCKED"
    await contracts_collection.update_one(query, update)


async def assert_payment_can_be_released(contract_id: str, milestone_id: str | None = None):
    query = {"contractId": contract_id, "status": {"$in": ACTIVE_DISPUTE_STATUSES}}
    if milestone_id:
        query["$or"] = [{"milestoneId": milestone_id}, {"milestoneId": None}]
    dispute = await disputes_collection.find_one(query)
    if dispute:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment release blocked by active dispute")


async def create_dispute(payload: DisputeCreate, user: CurrentUser):
    now = datetime.now(timezone.utc)
    document = {
        "contractId": payload.contractId,
        "milestoneId": payload.milestoneId,
        "raisedBy": user.id,
        "againstUser": payload.againstUser,
        "category": payload.category.value,
        "title": payload.title,
        "description": payload.description,
        "status": DisputeStatus.OPEN.value,
        "resolution": "",
        "escrowStatus": "LOCKED",
        "createdAt": now,
        "updatedAt": now,
    }
    result = await disputes_collection.insert_one(document)
    document["_id"] = result.inserted_id
    await freeze_escrow(payload.contractId, payload.milestoneId)
    await write_audit_log(user.id, "DISPUTE_CREATED", "DISPUTE", str(result.inserted_id), {"contractId": payload.contractId, "milestoneId": payload.milestoneId})
    return serialize_id(document)


async def list_disputes(user: CurrentUser):
    query = {}
    if user.role != "admin":
        query = {"$or": [{"raisedBy": user.id}, {"againstUser": user.id}]}
    cursor = disputes_collection.find(query).sort("createdAt", -1)
    return [serialize_id(item) async for item in cursor]


async def get_dispute_or_404(dispute_id: str, user: CurrentUser):
    dispute = await disputes_collection.find_one({"_id": object_id(dispute_id, "disputeId")})
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
    if user.role != "admin" and user.id not in [dispute.get("raisedBy"), dispute.get("againstUser")]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access this dispute")
    return dispute


async def get_dispute_detail(dispute_id: str, user: CurrentUser):
    dispute = await get_dispute_or_404(dispute_id, user)
    evidence = [serialize_id(item) async for item in evidence_collection.find({"disputeId": dispute_id}).sort("createdAt", -1)]
    responses = [serialize_id(item) async for item in responses_collection.find({"disputeId": dispute_id}).sort("createdAt", 1)]
    audit_logs = [serialize_id(item) async for item in audit_logs_collection.find({"entityType": "DISPUTE", "entityId": dispute_id}).sort("createdAt", 1)]
    return {"dispute": serialize_id(dispute), "evidence": evidence, "responses": responses, "auditLogs": audit_logs}


async def add_evidence(dispute_id: str, payload: EvidenceCreate, user: CurrentUser):
    dispute = await get_dispute_or_404(dispute_id, user)
    now = datetime.now(timezone.utc)
    document = {
        "disputeId": str(dispute["_id"]),
        "uploadedBy": user.id,
        "evidenceType": payload.evidenceType.value,
        "fileUrl": str(payload.fileUrl),
        "description": payload.description,
        "createdAt": now,
    }
    result = await evidence_collection.insert_one(document)
    document["_id"] = result.inserted_id
    await write_audit_log(user.id, "EVIDENCE_UPLOADED", "DISPUTE", str(dispute["_id"]), {"evidenceId": str(result.inserted_id)})
    return serialize_id(document)


async def add_response(dispute_id: str, payload: ResponseCreate, user: CurrentUser):
    dispute = await get_dispute_or_404(dispute_id, user)
    now = datetime.now(timezone.utc)
    document = {
        "disputeId": str(dispute["_id"]),
        "senderId": user.id,
        "message": payload.message,
        "createdAt": now,
    }
    result = await responses_collection.insert_one(document)
    document["_id"] = result.inserted_id
    await disputes_collection.update_one({"_id": dispute["_id"]}, {"$set": {"status": DisputeStatus.UNDER_REVIEW.value, "updatedAt": now}})
    await write_audit_log(user.id, "RESPONSE_SUBMITTED", "DISPUTE", str(dispute["_id"]), {"responseId": str(result.inserted_id)})
    return serialize_id(document)


async def update_status(dispute_id: str, payload: DisputeStatusUpdate, user: CurrentUser):
    dispute = await get_dispute_or_404(dispute_id, user)
    now = datetime.now(timezone.utc)
    update = {
        "status": payload.status.value,
        "resolution": payload.resolution,
        "updatedAt": now,
    }
    result = await disputes_collection.find_one_and_update(
        {"_id": dispute["_id"]},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    action = "DISPUTE_CLOSED" if payload.status == DisputeStatus.CLOSED else "DISPUTE_RESOLVED" if payload.status == DisputeStatus.RESOLVED else "ADMIN_STATUS_UPDATED"
    await write_audit_log(user.id, action, "DISPUTE", str(dispute["_id"]), {"status": payload.status.value, "adminAction": payload.adminAction.value if payload.adminAction else None})
    return serialize_id(result)


async def get_contract_disputes(contract_id: str, user: CurrentUser):
    query = {"contractId": contract_id}
    if user.role != "admin":
        query["$or"] = [{"raisedBy": user.id}, {"againstUser": user.id}]
    return [serialize_id(item) async for item in disputes_collection.find(query).sort("createdAt", -1)]

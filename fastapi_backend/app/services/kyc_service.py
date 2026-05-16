from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from pymongo import ReturnDocument

from app.auth.dependencies import CurrentUser
from app.db.mongodb import kyc_collection
from app.schemas.kyc import KycReviewAction, KycReviewRequest, KycStatus, KycSubmitForm
from app.services.audit_service import write_audit_log
from app.utils.object_id import object_id, serialize_id

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "kyc"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 8 * 1024 * 1024


def mask_document_number(value: str) -> str:
    cleaned = str(value or "").strip()
    if len(cleaned) <= 4:
        return "*" * len(cleaned)
    return f"{'*' * max(0, len(cleaned) - 4)}{cleaned[-4:]}"


def serialize_kyc(document: dict) -> dict:
    serialized = serialize_id(document)
    serialized["documentNumberMasked"] = mask_document_number(serialized.pop("documentNumber", ""))
    return serialized


async def save_upload_file(file: UploadFile, user_id: str, slot: str) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, WEBP, or PDF files are allowed",
        )

    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = ".pdf" if file.content_type == "application/pdf" else ".jpg"

    target_dir = UPLOAD_ROOT / user_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_name = f"{slot}-{uuid4().hex}{suffix}"
    target_path = target_dir / target_name

    size = 0
    with target_path.open("wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                buffer.close()
                target_path.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File must be 8MB or smaller")
            buffer.write(chunk)

    await file.seek(0)
    return {
        "fileName": file.filename or target_name,
        "fileType": file.content_type or "application/octet-stream",
        "fileUrl": f"/uploads/kyc/{user_id}/{target_name}",
    }


async def submit_kyc(
    payload: KycSubmitForm,
    user: CurrentUser,
    document_front: UploadFile,
    selfie: UploadFile,
    document_back: UploadFile | None = None,
):
    if user.role not in {"client", "freelancer"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only client and freelancer accounts can submit KYC")

    now = datetime.now(timezone.utc)
    front_file = await save_upload_file(document_front, user.id, "front")
    selfie_file = await save_upload_file(selfie, user.id, "selfie")
    back_file = await save_upload_file(document_back, user.id, "back") if document_back else None

    document = {
        "userId": user.id,
        "userRole": user.role,
        "documentType": payload.documentType.value,
        "fullName": payload.fullName.strip(),
        "dateOfBirth": payload.dateOfBirth.strip(),
        "country": payload.country.strip(),
        "documentNumber": payload.documentNumber.strip(),
        "address": payload.address.strip(),
        "status": KycStatus.PENDING.value,
        "rejectionReason": "",
        "adminNote": "",
        "documentFront": front_file,
        "documentBack": back_file,
        "selfie": selfie_file,
        "submittedAt": now,
        "reviewedAt": None,
        "reviewedBy": None,
        "updatedAt": now,
    }

    result = await kyc_collection.find_one_and_update(
        {"userId": user.id},
        {"$set": document, "$setOnInsert": {"createdAt": now}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    await write_audit_log(user.id, "KYC_SUBMITTED", "KYC", str(result["_id"]), {"status": KycStatus.PENDING.value})
    return serialize_kyc(result)


async def get_my_kyc(user: CurrentUser):
    document = await kyc_collection.find_one({"userId": user.id})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC profile has not been submitted")
    return serialize_kyc(document)


async def list_kyc(user: CurrentUser, status_filter: KycStatus | None = None):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")

    query = {}
    if status_filter:
        query["status"] = status_filter.value
    cursor = kyc_collection.find(query).sort("submittedAt", -1)
    return [serialize_kyc(item) async for item in cursor]


async def get_kyc_detail(kyc_id: str, user: CurrentUser):
    document = await kyc_collection.find_one({"_id": object_id(kyc_id, "kycId")})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found")

    if user.role != "admin" and document.get("userId") != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access this KYC record")
    return serialize_kyc(document)


async def review_kyc(kyc_id: str, payload: KycReviewRequest, user: CurrentUser):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")

    now = datetime.now(timezone.utc)
    next_status = {
        KycReviewAction.APPROVE: KycStatus.APPROVED.value,
        KycReviewAction.REJECT: KycStatus.REJECTED.value,
        KycReviewAction.REQUEST_RESUBMISSION: KycStatus.REJECTED.value,
    }[payload.action]

    update = {
        "status": next_status,
        "adminNote": payload.note.strip(),
        "rejectionReason": payload.note.strip() if payload.action != KycReviewAction.APPROVE else "",
        "reviewedAt": now,
        "reviewedBy": user.id,
        "updatedAt": now,
    }
    document = await kyc_collection.find_one_and_update(
        {"_id": object_id(kyc_id, "kycId")},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found")

    await write_audit_log(user.id, "KYC_REVIEWED", "KYC", str(document["_id"]), {"action": payload.action.value, "status": next_status})
    return serialize_kyc(document)

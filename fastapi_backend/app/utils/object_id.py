from bson import ObjectId
from fastapi import HTTPException, status


def object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}",
        )
    return ObjectId(value)


def serialize_id(document: dict | None) -> dict | None:
    if not document:
        return None
    document = dict(document)
    document["id"] = str(document.pop("_id"))
    for key in ["contractId", "milestoneId", "raisedBy", "againstUser", "uploadedBy", "senderId", "actorId", "entityId"]:
        if key in document and isinstance(document[key], ObjectId):
            document[key] = str(document[key])
    return document

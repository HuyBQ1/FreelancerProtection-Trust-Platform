from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class DisputeCategory(str, Enum):
    PAYMENT_NOT_RELEASED = "PAYMENT_NOT_RELEASED"
    POOR_DELIVERABLE_QUALITY = "POOR_DELIVERABLE_QUALITY"
    MISSED_DEADLINE = "MISSED_DEADLINE"
    CONTRACT_VIOLATION = "CONTRACT_VIOLATION"
    FRAUD_SUSPICIOUS_BEHAVIOR = "FRAUD_SUSPICIOUS_BEHAVIOR"


class DisputeStatus(str, Enum):
    OPEN = "OPEN"
    WAITING_RESPONSE = "WAITING_RESPONSE"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class EvidenceType(str, Enum):
    IMAGE = "IMAGE"
    PDF = "PDF"
    DELIVERABLE = "DELIVERABLE"
    GITHUB_LINK = "GITHUB_LINK"
    CHAT_HISTORY = "CHAT_HISTORY"


class AdminAction(str, Enum):
    REQUEST_CLARIFICATION = "REQUEST_CLARIFICATION"
    FREEZE_ESCROW = "FREEZE_ESCROW"
    APPROVE_FREELANCER = "APPROVE_FREELANCER"
    APPROVE_CLIENT = "APPROVE_CLIENT"
    CLOSE_DISPUTE = "CLOSE_DISPUTE"


class DisputeCreate(BaseModel):
    contractId: str
    milestoneId: str | None = None
    againstUser: str
    category: DisputeCategory
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=4000)


class EvidenceCreate(BaseModel):
    evidenceType: EvidenceType
    fileUrl: HttpUrl | str
    description: str = Field(default="", max_length=1000)


class ResponseCreate(BaseModel):
    message: str = Field(min_length=1, max_length=3000)


class DisputeStatusUpdate(BaseModel):
    status: DisputeStatus
    adminAction: AdminAction | None = None
    resolution: str = Field(default="", max_length=4000)


class DisputeOut(BaseModel):
    id: str
    contractId: str
    milestoneId: str | None = None
    raisedBy: str
    againstUser: str
    category: DisputeCategory
    title: str
    description: str
    status: DisputeStatus
    resolution: str = ""
    escrowStatus: str = "LOCKED"
    createdAt: datetime
    updatedAt: datetime


class EvidenceOut(BaseModel):
    id: str
    disputeId: str
    uploadedBy: str
    evidenceType: EvidenceType
    fileUrl: str
    description: str
    createdAt: datetime


class ResponseOut(BaseModel):
    id: str
    disputeId: str
    senderId: str
    message: str
    createdAt: datetime


class DisputeDetailOut(BaseModel):
    dispute: DisputeOut
    evidence: list[EvidenceOut]
    responses: list[ResponseOut]
    auditLogs: list[dict[str, Any]]

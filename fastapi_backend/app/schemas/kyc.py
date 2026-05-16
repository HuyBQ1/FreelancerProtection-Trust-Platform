from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class KycDocumentType(str, Enum):
    NATIONAL_ID = "NATIONAL_ID"
    PASSPORT = "PASSPORT"
    DRIVER_LICENSE = "DRIVER_LICENSE"
    BUSINESS_LICENSE = "BUSINESS_LICENSE"


class KycStatus(str, Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class KycReviewAction(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REQUEST_RESUBMISSION = "REQUEST_RESUBMISSION"


class KycSubmitForm(BaseModel):
    documentType: KycDocumentType
    fullName: str = Field(min_length=2, max_length=120)
    dateOfBirth: str = Field(min_length=4, max_length=40)
    country: str = Field(min_length=2, max_length=80)
    documentNumber: str = Field(min_length=4, max_length=80)
    address: str = Field(min_length=5, max_length=300)


class KycReviewRequest(BaseModel):
    action: KycReviewAction
    note: str = Field(default="", max_length=1000)


class KycFileOut(BaseModel):
    fileName: str
    fileType: str
    fileUrl: str


class KycOut(BaseModel):
    id: str
    userId: str
    userRole: str
    documentType: KycDocumentType
    fullName: str
    dateOfBirth: str
    country: str
    documentNumberMasked: str
    address: str
    status: KycStatus
    rejectionReason: str = ""
    adminNote: str = ""
    documentFront: KycFileOut
    documentBack: KycFileOut | None = None
    selfie: KycFileOut
    submittedAt: datetime
    reviewedAt: datetime | None = None
    reviewedBy: str | None = None
    updatedAt: datetime

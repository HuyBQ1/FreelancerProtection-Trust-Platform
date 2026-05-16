from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.auth.dependencies import CurrentUser, get_current_user, require_roles
from app.schemas.kyc import KycDocumentType, KycOut, KycReviewRequest, KycStatus, KycSubmitForm
from app.services import kyc_service

router = APIRouter(prefix="/kyc", tags=["kyc"])


@router.post("/submit", response_model=KycOut)
async def submit_kyc(
    documentType: KycDocumentType = Form(...),
    fullName: str = Form(...),
    dateOfBirth: str = Form(...),
    country: str = Form(...),
    documentNumber: str = Form(...),
    address: str = Form(...),
    documentFront: UploadFile = File(...),
    selfie: UploadFile = File(...),
    documentBack: UploadFile | None = File(None),
    user: CurrentUser = Depends(require_roles("client", "freelancer")),
):
    payload = KycSubmitForm(
        documentType=documentType,
        fullName=fullName,
        dateOfBirth=dateOfBirth,
        country=country,
        documentNumber=documentNumber,
        address=address,
    )
    return await kyc_service.submit_kyc(payload, user, documentFront, selfie, documentBack)


@router.get("/me", response_model=KycOut)
async def get_my_kyc(user: CurrentUser = Depends(get_current_user)):
    return await kyc_service.get_my_kyc(user)


@router.get("", response_model=list[KycOut])
async def list_kyc(
    status: KycStatus | None = None,
    user: CurrentUser = Depends(require_roles("admin")),
):
    return await kyc_service.list_kyc(user, status)


@router.get("/{kyc_id}", response_model=KycOut)
async def get_kyc_detail(kyc_id: str, user: CurrentUser = Depends(get_current_user)):
    return await kyc_service.get_kyc_detail(kyc_id, user)


@router.patch("/{kyc_id}/review", response_model=KycOut)
async def review_kyc(
    kyc_id: str,
    payload: KycReviewRequest,
    user: CurrentUser = Depends(require_roles("admin")),
):
    return await kyc_service.review_kyc(kyc_id, payload, user)

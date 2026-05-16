from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, get_current_user, require_roles
from app.schemas.disputes import DisputeCreate, DisputeDetailOut, DisputeOut, DisputeStatusUpdate, EvidenceCreate, EvidenceOut, ResponseCreate, ResponseOut
from app.services import dispute_service

router = APIRouter(tags=["disputes"])


@router.post("/disputes", response_model=DisputeOut)
async def create_dispute(payload: DisputeCreate, user: CurrentUser = Depends(require_roles("client", "freelancer"))):
    return await dispute_service.create_dispute(payload, user)


@router.get("/disputes", response_model=list[DisputeOut])
async def list_disputes(user: CurrentUser = Depends(get_current_user)):
    return await dispute_service.list_disputes(user)


@router.get("/disputes/{dispute_id}", response_model=DisputeDetailOut)
async def get_dispute(dispute_id: str, user: CurrentUser = Depends(get_current_user)):
    return await dispute_service.get_dispute_detail(dispute_id, user)


@router.post("/disputes/{dispute_id}/evidence", response_model=EvidenceOut)
async def add_evidence(dispute_id: str, payload: EvidenceCreate, user: CurrentUser = Depends(get_current_user)):
    return await dispute_service.add_evidence(dispute_id, payload, user)


@router.post("/disputes/{dispute_id}/responses", response_model=ResponseOut)
async def add_response(dispute_id: str, payload: ResponseCreate, user: CurrentUser = Depends(get_current_user)):
    return await dispute_service.add_response(dispute_id, payload, user)


@router.patch("/disputes/{dispute_id}/status", response_model=DisputeOut)
async def update_dispute_status(dispute_id: str, payload: DisputeStatusUpdate, user: CurrentUser = Depends(require_roles("admin"))):
    return await dispute_service.update_status(dispute_id, payload, user)


@router.get("/contracts/{contract_id}/disputes", response_model=list[DisputeOut])
async def get_contract_disputes(contract_id: str, user: CurrentUser = Depends(get_current_user)):
    return await dispute_service.get_contract_disputes(contract_id, user)

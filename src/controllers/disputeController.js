import mongoose from 'mongoose';
import Contract from '../models/Contract.js';
import Dispute, { DISPUTE_CATEGORIES, DISPUTE_STATUSES } from '../models/Dispute.js';
import DisputeEvidence, { EVIDENCE_TYPES } from '../models/DisputeEvidence.js';
import DisputeResponse from '../models/DisputeResponse.js';
import Job from '../models/Job.js';
import { createAuditLog } from '../services/auditLogService.js';
import { findAccountByIdAndRole } from '../services/accountService.js';
import { BLOCKING_DISPUTE_STATUSES, normalizeContractId } from '../services/disputeService.js';

const ADMIN_ACTIONS = ['REQUEST_CLARIFICATION', 'FREEZE_ESCROW', 'APPROVE_FREELANCER', 'APPROVE_CLIENT', 'CLOSE_DISPUTE'];

function displayName(account) {
  return account?.fullName || account?.companyName || account?.email || 'Người dùng';
}

function assertRole(req, roles) {
  if (!roles.includes(req.user?.role)) {
    const error = new Error('Bạn không có quyền thực hiện thao tác này');
    error.statusCode = 403;
    throw error;
  }
}

function assertObjectId(value, label) {
  const normalized = normalizeContractId(value);
  if (!normalized || !mongoose.Types.ObjectId.isValid(normalized)) {
    const error = new Error(`${label} không hợp lệ`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

async function findContractRecord(contractId) {
  const id = assertObjectId(contractId, 'Hợp đồng');
  const job = await Job.findById(id);
  if (job) {
    return { record: job, model: 'Job' };
  }

  const contract = await Contract.findById(id);
  if (contract) {
    return { record: contract, model: 'Contract' };
  }

  const error = new Error('Không tìm thấy hợp đồng hoặc dự án');
  error.statusCode = 404;
  throw error;
}

function getParticipants(contractRecord, contractModel) {
  if (contractModel === 'Job') {
    return {
      clientId: contractRecord.clientId,
      freelancerId: contractRecord.assignedFreelancerId,
      title: contractRecord.title,
      clientName: contractRecord.clientName || '',
      freelancerName: contractRecord.assignedFreelancerName || '',
    };
  }

  return {
    clientId: contractRecord.clientId,
    freelancerId: contractRecord.freelancerId,
    title: contractRecord.title?.vi || contractRecord.title?.en || 'Hợp đồng',
    clientName: contractRecord.clientName || '',
    freelancerName: '',
  };
}

async function serializeDispute(dispute, includeDetails = false) {
  const item = dispute.toObject?.() || dispute;
  const base = {
    id: item._id?.toString?.() || item.id,
    contractId: item.contractId?.toString?.() || '',
    contractModel: item.contractModel || 'Job',
    milestoneId: item.milestoneId || '',
    raisedBy: item.raisedBy?.toString?.() || '',
    raisedByRole: item.raisedByRole,
    raisedByName: item.raisedByName || '',
    againstUser: item.againstUser?.toString?.() || '',
    againstUserRole: item.againstUserRole,
    againstUserName: item.againstUserName || '',
    category: item.category,
    title: item.title,
    description: item.description,
    status: item.status,
    resolution: item.resolution || '',
    adminAction: item.adminAction || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  if (!includeDetails) return base;

  const [evidence, responses] = await Promise.all([
    DisputeEvidence.find({ disputeId: item._id }).sort({ createdAt: -1 }),
    DisputeResponse.find({ disputeId: item._id }).sort({ createdAt: 1 }),
  ]);

  return {
    ...base,
    evidence: evidence.map((entry) => ({
      id: entry._id.toString(),
      disputeId: entry.disputeId.toString(),
      uploadedBy: entry.uploadedBy.toString(),
      uploadedByRole: entry.uploadedByRole,
      uploadedByName: entry.uploadedByName,
      evidenceType: entry.evidenceType,
      fileUrl: entry.fileUrl,
      fileName: entry.fileName || '',
      fileType: entry.fileType || '',
      description: entry.description,
      createdAt: entry.createdAt,
    })),
    responses: responses.map((entry) => ({
      id: entry._id.toString(),
      disputeId: entry.disputeId.toString(),
      senderId: entry.senderId.toString(),
      senderRole: entry.senderRole,
      senderName: entry.senderName,
      message: entry.message,
      createdAt: entry.createdAt,
    })),
  };
}

async function assertDisputeAccess(req, dispute) {
  if (req.user.role === 'admin') return;

  const userId = String(req.user._id);
  if (String(dispute.raisedBy) === userId || String(dispute.againstUser) === userId) {
    return;
  }

  const error = new Error('Bạn không có quyền xem tranh chấp này');
  error.statusCode = 403;
  throw error;
}

async function setEscrowLock(contractId, contractModel, locked) {
  if (contractModel === 'Job') {
    await Job.findByIdAndUpdate(contractId, { $set: { escrowStatus: locked ? 'LOCKED' : 'ACTIVE' } });
    return;
  }

  await Contract.findByIdAndUpdate(contractId, { $set: { escrowStatus: locked ? 'LOCKED' : 'ACTIVE' } });
}

async function refreshEscrowLock(dispute) {
  const activeDispute = await Dispute.exists({
    contractId: dispute.contractId,
    status: { $in: BLOCKING_DISPUTE_STATUSES },
  });

  await setEscrowLock(dispute.contractId, dispute.contractModel, Boolean(activeDispute));
}

export async function createDispute(req, res) {
  assertRole(req, ['client', 'freelancer']);

  const { contractId, milestoneId = '', category, title, description } = req.body || {};
  if (!DISPUTE_CATEGORIES.includes(category)) {
    const error = new Error('Loại tranh chấp không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (!`${title || ''}`.trim() || `${description || ''}`.trim().length < 10) {
    const error = new Error('Vui lòng nhập tiêu đề và mô tả ít nhất 10 ký tự');
    error.statusCode = 400;
    throw error;
  }

  const { record, model } = await findContractRecord(contractId);
  const participants = getParticipants(record, model);
  const isClient = String(participants.clientId) === String(req.user._id);
  const isFreelancer = String(participants.freelancerId) === String(req.user._id);

  if (!isClient && !isFreelancer) {
    const error = new Error('Bạn chỉ có thể tạo tranh chấp cho hợp đồng của mình');
    error.statusCode = 403;
    throw error;
  }

  const againstRole = isClient ? 'freelancer' : 'client';
  const againstUser = isClient ? participants.freelancerId : participants.clientId;
  if (!againstUser) {
    const error = new Error('Hợp đồng chưa có đủ hai bên để tạo tranh chấp');
    error.statusCode = 409;
    throw error;
  }

  const { account: againstAccount } = await findAccountByIdAndRole(againstUser, againstRole);
  const dispute = await Dispute.create({
    contractId: normalizeContractId(contractId),
    contractModel: model,
    milestoneId: `${milestoneId || ''}`.trim(),
    raisedBy: req.user._id,
    raisedByRole: req.user.role,
    raisedByName: displayName(req.user),
    againstUser,
    againstUserRole: againstRole,
    againstUserName: displayName(againstAccount) || (isClient ? participants.freelancerName : participants.clientName),
    category,
    title: `${title}`.trim(),
    description: `${description}`.trim(),
    status: 'OPEN',
  });

  await setEscrowLock(dispute.contractId, dispute.contractModel, true);
  await createAuditLog({
    actor: req.user,
    action: 'DISPUTE_CREATED',
    entityType: 'Dispute',
    entityId: dispute._id,
    metadata: { contractId: dispute.contractId.toString(), milestoneId: dispute.milestoneId },
  });

  res.status(201).json({ dispute: await serializeDispute(dispute, true) });
}

export async function listDisputes(req, res) {
  const query = req.user.role === 'admin'
    ? {}
    : { $or: [{ raisedBy: req.user._id }, { againstUser: req.user._id }] };

  if (req.query.contractId) {
    query.contractId = normalizeContractId(req.query.contractId);
  }

  const disputes = await Dispute.find(query).sort({ updatedAt: -1, createdAt: -1 }).limit(200);
  res.status(200).json({ disputes: await Promise.all(disputes.map((item) => serializeDispute(item))) });
}

export async function getDisputeById(req, res) {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    const error = new Error('Không tìm thấy tranh chấp');
    error.statusCode = 404;
    throw error;
  }

  await assertDisputeAccess(req, dispute);
  res.status(200).json({ dispute: await serializeDispute(dispute, true) });
}

export async function addEvidence(req, res) {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    const error = new Error('Không tìm thấy tranh chấp');
    error.statusCode = 404;
    throw error;
  }
  await assertDisputeAccess(req, dispute);

  const { evidenceType, fileUrl, fileName = '', fileType = '', description = '' } = req.body || {};
  if (!EVIDENCE_TYPES.includes(evidenceType) || !`${fileUrl || ''}`.trim()) {
    const error = new Error('Vui lòng chọn loại bằng chứng và nhập liên kết/tệp bằng chứng');
    error.statusCode = 400;
    throw error;
  }

  const evidence = await DisputeEvidence.create({
    disputeId: dispute._id,
    uploadedBy: req.user._id,
    uploadedByRole: req.user.role,
    uploadedByName: displayName(req.user),
    evidenceType,
    fileUrl: `${fileUrl}`.trim(),
    fileName: `${fileName || ''}`.trim(),
    fileType: `${fileType || ''}`.trim(),
    description: `${description || ''}`.trim(),
  });

  await createAuditLog({
    actor: req.user,
    action: 'DISPUTE_EVIDENCE_UPLOADED',
    entityType: 'Dispute',
    entityId: dispute._id,
    metadata: { evidenceId: evidence._id.toString(), evidenceType },
  });

  res.status(201).json({ evidence });
}

export async function addResponse(req, res) {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    const error = new Error('Không tìm thấy tranh chấp');
    error.statusCode = 404;
    throw error;
  }
  await assertDisputeAccess(req, dispute);

  const message = `${req.body?.message || ''}`.trim();
  if (!message) {
    const error = new Error('Vui lòng nhập nội dung phản hồi');
    error.statusCode = 400;
    throw error;
  }

  const response = await DisputeResponse.create({
    disputeId: dispute._id,
    senderId: req.user._id,
    senderRole: req.user.role,
    senderName: displayName(req.user),
    message,
  });

  if (req.user.role !== 'admin' && dispute.status === 'OPEN') {
    dispute.status = 'WAITING_RESPONSE';
    await dispute.save();
  }

  await createAuditLog({
    actor: req.user,
    action: 'DISPUTE_RESPONSE_SUBMITTED',
    entityType: 'Dispute',
    entityId: dispute._id,
    metadata: { responseId: response._id.toString() },
  });

  res.status(201).json({ response, dispute: await serializeDispute(dispute, true) });
}

export async function updateDisputeStatus(req, res) {
  assertRole(req, ['admin']);

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    const error = new Error('Không tìm thấy tranh chấp');
    error.statusCode = 404;
    throw error;
  }

  const { status, resolution = '', adminAction = '' } = req.body || {};
  if (!DISPUTE_STATUSES.includes(status)) {
    const error = new Error('Trạng thái tranh chấp không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (adminAction && !ADMIN_ACTIONS.includes(adminAction)) {
    const error = new Error('Hành động admin không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  dispute.status = status;
  dispute.resolution = `${resolution || ''}`.trim();
  dispute.adminAction = adminAction;
  await dispute.save();

  if (adminAction === 'FREEZE_ESCROW') {
    await setEscrowLock(dispute.contractId, dispute.contractModel, true);
  } else {
    await refreshEscrowLock(dispute);
  }

  await createAuditLog({
    actor: req.user,
    action: ['RESOLVED', 'CLOSED'].includes(status) ? `DISPUTE_${status}` : 'DISPUTE_STATUS_UPDATED',
    entityType: 'Dispute',
    entityId: dispute._id,
    metadata: { status, adminAction, resolution: dispute.resolution },
  });

  res.status(200).json({ dispute: await serializeDispute(dispute, true) });
}

export async function getContractDisputes(req, res) {
  const contractId = assertObjectId(req.params.contractId, 'Hợp đồng');
  const disputes = await Dispute.find({ contractId }).sort({ createdAt: -1 });

  if (req.user.role !== 'admin') {
    for (const dispute of disputes) {
      await assertDisputeAccess(req, dispute);
    }
  }

  res.status(200).json({ disputes: await Promise.all(disputes.map((item) => serializeDispute(item))) });
}

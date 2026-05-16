import mongoose from 'mongoose';
import Dispute from '../models/Dispute.js';

export const BLOCKING_DISPUTE_STATUSES = ['OPEN', 'WAITING_RESPONSE', 'UNDER_REVIEW'];

export function normalizeContractId(value) {
  const raw = `${value || ''}`.trim();
  const normalized = raw.replace(/^job-contract-/, '');
  return mongoose.Types.ObjectId.isValid(normalized) ? normalized : '';
}

export async function hasBlockingDispute(contractId, milestoneId = '') {
  const normalizedContractId = normalizeContractId(contractId);
  if (!normalizedContractId) return false;

  const query = {
    contractId: normalizedContractId,
    status: { $in: BLOCKING_DISPUTE_STATUSES },
  };

  if (`${milestoneId || ''}`.trim()) {
    query.$or = [
      { milestoneId: `${milestoneId}` },
      { milestoneId: '' },
      { milestoneId: { $exists: false } },
    ];
  }

  return Boolean(await Dispute.exists(query));
}

export async function assertNoBlockingDispute(contractId, milestoneId = '') {
  if (await hasBlockingDispute(contractId, milestoneId)) {
    const error = new Error('Khoản thanh toán đang bị khóa vì hợp đồng hoặc milestone có tranh chấp đang xử lý');
    error.statusCode = 409;
    throw error;
  }
}

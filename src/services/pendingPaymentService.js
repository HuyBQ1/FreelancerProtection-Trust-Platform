import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from './accountService.js';

function parseBudgetNumber(budget) {
  const normalized = `${budget || ''}`.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMilestoneTitle(milestone, index) {
  if (typeof milestone?.title === 'string') {
    return milestone.title || `Milestone ${index + 1}`;
  }

  return milestone?.title?.en || milestone?.title?.vi || `Milestone ${index + 1}`;
}

export function calculateReservablePendingAmount(job) {
  if (!job || job.status !== 'assigned' || !job.assignedFreelancerId) {
    return 0;
  }

  const milestones = Array.isArray(job.contractState?.milestones) ? job.contractState.milestones : [];

  return milestones.reduce((sum, milestone) => {
    if (milestone.status === 'Approved') {
      return sum;
    }

    return sum + parseBudgetNumber(milestone.amount);
  }, 0);
}

export async function assertClientCanReservePendingPayments(job) {
  const requiredAmount = calculateReservablePendingAmount(job);

  if (requiredAmount <= 0) {
    return { requiredAmount, availableBalance: 0 };
  }

  const { account: clientAccount } = await findAccountByIdAndRole(job.clientId, 'client');

  if (!clientAccount) {
    const error = new Error('Client account not found for pending payment reservation');
    error.statusCode = 404;
    throw error;
  }

  const availableBalance = clientAccount.balance || 0;
  if (availableBalance < requiredAmount) {
    const error = new Error(`Client needs ${requiredAmount} available balance before this job can be accepted`);
    error.statusCode = 400;
    throw error;
  }

  return { requiredAmount, availableBalance };
}

export async function ensurePendingPaymentsForJob(job, { strict = false } = {}) {
  if (!job || job.status !== 'assigned' || !job.assignedFreelancerId) {
    return { reservedAmount: 0, pendingAmount: 0, skippedAmount: 0 };
  }

  const milestones = Array.isArray(job.contractState?.milestones) ? job.contractState.milestones : [];
  const changes = [];

  for (const [index, milestone] of milestones.entries()) {
    const amount = parseBudgetNumber(milestone.amount);
    if (amount <= 0 || milestone.status === 'Approved') {
      continue;
    }

    const completedTransaction = await Transaction.findOne({
      type: 'release',
      status: 'completed',
      jobId: job._id,
      milestoneIndex: index,
    });

    if (completedTransaction) {
      continue;
    }

    const pendingTransaction = await Transaction.findOne({
      type: 'release',
      status: 'pending',
      jobId: job._id,
      milestoneIndex: index,
      fromUser: job.clientId,
      toUser: job.assignedFreelancerId,
    });

    changes.push({
      amount,
      index,
      milestone,
      pendingTransaction,
      adjustment: pendingTransaction ? amount - (pendingTransaction.amount || 0) : amount,
    });
  }

  const totalAdjustment = changes.reduce((sum, change) => sum + change.adjustment, 0);
  const pendingAmount = changes.reduce((sum, change) => sum + change.amount, 0);
  if (totalAdjustment === 0) {
    return { reservedAmount: 0, pendingAmount, skippedAmount: 0 };
  }

  const { account: clientAccount, model: clientModel } = await findAccountByIdAndRole(job.clientId, 'client');
  if (!clientAccount || !clientModel) {
    if (strict) {
      const error = new Error('Client account not found for pending payment reservation');
      error.statusCode = 404;
      throw error;
    }

    return { reservedAmount: 0, pendingAmount: 0, skippedAmount: Math.max(totalAdjustment, 0) };
  }

  const clientBalance = clientAccount.balance || 0;
  if (totalAdjustment > 0 && clientBalance < totalAdjustment) {
    if (strict) {
      const error = new Error('Client has insufficient available balance to reserve pending milestone payments');
      error.statusCode = 400;
      throw error;
    }

    return { reservedAmount: 0, pendingAmount: 0, skippedAmount: totalAdjustment };
  }

  await clientModel.findByIdAndUpdate(clientAccount._id, {
    $set: { balance: clientBalance - totalAdjustment },
  });

  await Promise.all(changes.map((change) => {
    if (change.pendingTransaction) {
      change.pendingTransaction.amount = change.amount;
      change.pendingTransaction.description = `Pending milestone payment for job: ${job.title} - ${getMilestoneTitle(change.milestone, change.index)}`;
      return change.pendingTransaction.save();
    }

    return Transaction.create({
      type: 'release',
      amount: change.amount,
      fromUser: job.clientId,
      toUser: job.assignedFreelancerId,
      jobId: job._id,
      milestoneIndex: change.index,
      description: `Pending milestone payment for job: ${job.title} - ${getMilestoneTitle(change.milestone, change.index)}`,
      status: 'pending',
    });
  }));

  return { reservedAmount: totalAdjustment, pendingAmount, skippedAmount: 0 };
}

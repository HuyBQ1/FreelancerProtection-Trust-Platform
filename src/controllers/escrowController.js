import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from '../services/accountService.js';
import { ensurePendingPaymentsForJob } from '../services/pendingPaymentService.js';

function getStrictObjectId(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return /^[a-fA-F0-9]{24}$/.test(value) ? value : null;
}

export const depositToEscrow = async (req, res, next) => {
  try {
    const depositAmount = Number(req.body.amount) || 0;
    const { contractId, milestoneId, amount } = req.body;
    const validContractId = getStrictObjectId(contractId);
    const validMilestoneId = getStrictObjectId(milestoneId);

    if (depositAmount <= 0) {
      return res.status(400).json({ message: 'A valid deposit amount is required' });
    }

    const clientId = req.user._id;

    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can deposit to escrow' });
    }

    req.user.balance = (req.user.balance || 0) + depositAmount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: {
        balance: req.user.balance,
      },
    });

    const transaction = await Transaction.create({
      type: 'deposit',
      amount: depositAmount,
      fromUser: clientId,
      description: 'Balance topped up from linked payment source',
    });

    res.status(200).json({
      message: 'Deposit successful',
      transaction,
      summary: {
        balance: req.user.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const releaseToFreelancer = async (req, res, next) => {
  try {
    const requestedAmount = Number(req.body?.amount) || 0;
    const { contractId, milestoneId } = req.body;
    const validContractId = getStrictObjectId(contractId);
    const validMilestoneId = getStrictObjectId(milestoneId);

    const clientId = req.user._id;

    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can release funds' });
    }

    let amount = 0;
    let contract = null;
    let milestone = null;

    if (validContractId) {
      contract = await Contract.findById(validContractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      milestone = validMilestoneId ? contract.milestones.id(validMilestoneId) : null;
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      if (!milestone.isFunded) {
        return res.status(400).json({ message: 'Milestone is not funded yet' });
      }
      amount = milestone.amount;
    } else {
      amount = requestedAmount > 0 ? requestedAmount : 800;
    }

    const currentAvailableBalance = req.user.balance || 0;

    if (currentAvailableBalance < amount) {
       return res.status(400).json({ message: 'Insufficient available balance' });
    }

    // Release funds
    req.user.balance = currentAvailableBalance - amount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: { balance: req.user.balance },
    });

    let toUser = null;
    if (contract) {
      const { account: freelancer, model: freelancerModel } = await findAccountByIdAndRole(contract.freelancerId, 'freelancer');
      if (freelancer && freelancerModel) {
        const nextBalance = (freelancer.balance || 0) + amount;
        await freelancerModel.findByIdAndUpdate(freelancer._id, {
          $set: { balance: nextBalance },
        });
        toUser = freelancer._id;
      }

      milestone.status = 'Approved';
      await contract.save();
    }

    const transaction = await Transaction.create({
      type: 'release',
      amount,
      fromUser: clientId,
      toUser,
      contractId: validContractId,
      milestoneId: validMilestoneId,
      description: `Release funds for milestone${milestone ? ': ' + milestone.title.en : ''}`
    });

    res.status(200).json({
      message: 'Funds released successfully',
      transaction,
      milestone,
      summary: {
        balance: req.user.balance || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEscrowSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const assignedJobs = await Job.find(req.user.role === 'client'
      ? { clientId: userId, status: 'assigned' }
      : { assignedFreelancerId: userId, status: 'assigned' });

    const pendingSyncResults = await Promise.all(assignedJobs.map((job) => ensurePendingPaymentsForJob(job, { strict: false })));

    const freshAccount = req.accountModel ? await req.accountModel.findById(userId) : null;

    const summary = {
      balance: freshAccount?.balance ?? req.user.balance ?? 0,
    };
    const transactionQuery = req.user.role === 'client'
      ? { $or: [{ fromUser: userId }, { toUser: userId }] }
      : { $or: [{ toUser: userId }, { fromUser: userId }] };
    const transactions = await Transaction.find(transactionQuery).sort({ createdAt: -1 }).limit(10);
    const pendingQuery = req.user.role === 'client'
      ? { fromUser: userId, status: 'pending' }
      : { toUser: userId, status: 'pending' };
    const pendingTransactions = await Transaction.find(pendingQuery);
    const recentById = new Map();
    [...pendingTransactions, ...transactions].forEach((transaction) => {
      recentById.set(transaction._id.toString(), transaction);
    });
    const recentTransactions = Array.from(recentById.values())
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);

    summary.pendingBalance = pendingTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    summary.pendingSkippedAmount = pendingSyncResults.reduce((sum, result) => sum + (result.skippedAmount || 0), 0);
    summary.pendingTransactions = pendingTransactions;
    summary.recentTransactions = recentTransactions;

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

export const topUpBalance = async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount) || 0;

    if (amount <= 0) {
      return res.status(400).json({ message: 'A valid top-up amount is required' });
    }

    const nextBalance = (req.user.balance || 0) + amount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: { balance: nextBalance },
    });

    const transaction = await Transaction.create({
      type: 'deposit',
      amount,
      toUser: req.user._id,
      description: 'Wallet top-up from linked bank account',
    });

    res.status(200).json({
      message: 'Top-up successful',
      transaction,
      summary: {
        balance: nextBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawBalance = async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount) || 0;

    if (amount <= 0) {
      return res.status(400).json({ message: 'A valid withdrawal amount is required' });
    }

    const currentBalance = req.user.balance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    const nextBalance = currentBalance - amount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: { balance: nextBalance },
    });

    const transaction = await Transaction.create({
      type: 'withdrawal',
      amount,
      fromUser: req.user._id,
      description: 'Withdrawal to linked bank account',
    });

    res.status(200).json({
      message: 'Withdrawal successful',
      transaction,
      summary: {
        balance: nextBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

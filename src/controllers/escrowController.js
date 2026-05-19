import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from '../services/accountService.js';
import { assertNoBlockingDispute } from '../services/disputeService.js';
import { ensurePendingPaymentsForJob } from '../services/pendingPaymentService.js';
import { formatMoney } from '../utils/money.js';

const sepayConfig = {
  bankCode: process.env.SEPAY_BANK_CODE || 'MBBank',
  bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '',
  accountName: process.env.SEPAY_ACCOUNT_NAME || '',
  webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
};

function getStrictObjectId(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return /^[a-fA-F0-9]{24}$/.test(value) ? value : null;
}

function assertBankAccountIsActive(user) {
  if (user?.settings?.bankAccount?.isFrozen) {
    const error = new Error(user.settings.bankAccount.frozenReason || 'Bank account is frozen by admin');
    error.statusCode = 403;
    throw error;
  }
}

function buildSepayCode(userId) {
  const shortUserId = `${userId || ''}`.slice(-6).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FPTP${shortUserId}${randomPart}`;
}

function buildVietQrUrl({ amount, content }) {
  if (!sepayConfig.accountNumber || !sepayConfig.bankCode) {
    return '';
  }

  const query = new URLSearchParams({
    amount: `${Math.round(amount)}`,
    addInfo: content,
    accountName: sepayConfig.accountName,
  });

  return `https://img.vietqr.io/image/${sepayConfig.bankCode}-${sepayConfig.accountNumber}-compact2.png?${query.toString()}`;
}

function verifySepayWebhook(req) {
  if (!sepayConfig.webhookSecret) {
    return true;
  }

  const authorization = `${req.headers.authorization || ''}`;
  const apiKey = `${req.headers['x-api-key'] || req.headers.apikey || ''}`;
  const hasAuthHeader = Boolean(authorization || apiKey);

  if (!hasAuthHeader) {
    return true;
  }

  return authorization === `Apikey ${sepayConfig.webhookSecret}`
    || authorization === `Bearer ${sepayConfig.webhookSecret}`
    || apiKey === sepayConfig.webhookSecret;
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
      await assertNoBlockingDispute(validContractId, validMilestoneId);
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
      .filter((transaction) => !(transaction?.paymentProvider === 'sepay' && transaction?.status === 'pending'))
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
    assertBankAccountIsActive(req.user);

    const amount = Number(req.body?.amount) || 0;

    if (amount <= 0) {
      return res.status(400).json({ message: 'A valid top-up amount is required' });
    }

    const paymentCode = buildSepayCode(req.user._id);
    const transferContent = `${paymentCode} NAP VI FPTP`;

    const transaction = await Transaction.create({
      type: 'deposit',
      amount,
      toUser: req.user._id,
      toUserRole: req.user.role,
      description: `SePay wallet top-up pending: ${paymentCode}`,
      status: 'pending',
      paymentProvider: 'sepay',
      paymentCode,
      paymentMetadata: {
        bankCode: sepayConfig.bankCode,
        bankName: sepayConfig.bankName,
        accountNumber: sepayConfig.accountNumber,
        accountName: sepayConfig.accountName,
        transferContent,
      },
    });

    res.status(200).json({
      message: 'SePay top-up request created',
      transaction,
      payment: {
        provider: 'sepay',
        amount,
        amountLabel: formatMoney(amount),
        paymentCode,
        bankCode: sepayConfig.bankCode,
        bankName: sepayConfig.bankName,
        accountNumber: sepayConfig.accountNumber,
        accountName: sepayConfig.accountName,
        transferContent,
        qrUrl: buildVietQrUrl({ amount, content: transferContent }),
      },
      summary: {
        balance: req.user.balance || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleSepayWebhook = async (req, res, next) => {
  try {
    if (!verifySepayWebhook(req)) {
      return res.status(401).json({ success: false, message: 'Invalid SePay webhook secret' });
    }

    const payload = req.body || {};
    const transferType = `${payload.transferType || payload.type || ''}`.toLowerCase();
    const content = `${payload.content || payload.description || payload.code || ''}`;
    const transferAmount = Number(payload.transferAmount || payload.amount || 0);
    console.log('[SePay webhook]', {
      id: payload.id || payload.referenceCode || '',
      transferType,
      transferAmount,
      accountNumber: payload.accountNumber || '',
      code: payload.code || '',
      content,
    });

    if (transferType && !['in', 'deposit', 'credit'].includes(transferType)) {
      return res.status(200).json({ success: true });
    }

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(200).json({ success: true });
    }

    const pendingTopUps = await Transaction.find({
      paymentProvider: 'sepay',
      status: 'pending',
    }).sort({ createdAt: -1 });

    const transaction = pendingTopUps.find((item) => {
      const code = `${item.paymentCode || ''}`.toUpperCase();
      return code && (`${payload.code || ''}`.toUpperCase() === code || content.toUpperCase().includes(code));
    });

    const fallbackTransaction = transaction || await Transaction.findOne({
      paymentProvider: 'sepay',
      status: 'pending',
      amount: transferAmount,
    }).sort({ createdAt: 1 });

    if (!fallbackTransaction) {
      console.log('[SePay webhook] No matching pending top-up', { transferAmount, content });
      return res.status(200).json({ success: true, message: 'No matching pending top-up' });
    }

    if (!content.toUpperCase().includes(fallbackTransaction.paymentCode.toUpperCase()) && transferAmount !== fallbackTransaction.amount) {
      console.log('[SePay webhook] Payload does not match pending top-up', {
        paymentCode: fallbackTransaction.paymentCode,
        expectedAmount: fallbackTransaction.amount,
        transferAmount,
        content,
      });
      return res.status(200).json({ success: true, message: 'Webhook does not match pending top-up' });
    }

    const paidAmount = Math.min(transferAmount, fallbackTransaction.amount);
    const { account, model } = await findAccountByIdAndRole(fallbackTransaction.toUser, fallbackTransaction.toUserRole || 'client');

    if (!account || !model) {
      fallbackTransaction.status = 'failed';
      fallbackTransaction.paymentMetadata = {
        ...(fallbackTransaction.paymentMetadata || {}),
        webhookPayload: payload,
        failureReason: 'Account not found',
      };
      await fallbackTransaction.save();
      return res.status(200).json({ success: true });
    }

    const nextBalance = (account.balance || 0) + paidAmount;
    await model.findByIdAndUpdate(account._id, { $set: { balance: nextBalance } });

    fallbackTransaction.amount = paidAmount;
    fallbackTransaction.status = 'completed';
    fallbackTransaction.providerTransactionId = `${payload.id || payload.referenceCode || ''}`;
    fallbackTransaction.description = `SePay wallet top-up completed: ${fallbackTransaction.paymentCode}`;
    fallbackTransaction.paymentMetadata = {
      ...(fallbackTransaction.paymentMetadata || {}),
      webhookPayload: payload,
      completedAt: new Date(),
    };
    await fallbackTransaction.save();
    console.log('[SePay webhook] Top-up completed', {
      transactionId: fallbackTransaction._id,
      paidAmount,
      nextBalance,
      paymentCode: fallbackTransaction.paymentCode,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const withdrawBalance = async (req, res, next) => {
  try {
    assertBankAccountIsActive(req.user);

    const amount = Number(req.body?.amount) || 0;
    const bankName = `${req.body?.bankName || ''}`.trim();
    const accountNumber = `${req.body?.accountNumber || ''}`.trim();
    const accountName = `${req.body?.accountName || ''}`.trim();

    if (amount <= 0) {
      return res.status(400).json({ message: 'A valid withdrawal amount is required' });
    }

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Bank name, account number, and account holder are required' });
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
      fromUserRole: req.user.role,
      description: 'Withdrawal request pending admin approval',
      status: 'pending',
      paymentProvider: 'manual_bank_transfer',
      paymentMetadata: {
        bankName,
        accountNumber,
        accountName,
        requestedAt: new Date(),
        requesterRole: req.user.role,
      },
    });

    res.status(200).json({
      message: 'Withdrawal request submitted and is pending admin approval',
      transaction,
      summary: {
        balance: nextBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingWithdrawals = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view withdrawal requests' });
    }

    const withdrawals = await Transaction.find({
      type: 'withdrawal',
      status: 'pending',
    }).sort({ createdAt: -1 });

    res.status(200).json({ withdrawals });
  } catch (error) {
    next(error);
  }
};

export const approveWithdrawal = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve withdrawal requests' });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.withdrawalId,
      type: 'withdrawal',
      status: 'pending',
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Pending withdrawal request not found' });
    }

    transaction.status = 'completed';
    transaction.description = 'Withdrawal approved by admin';
    transaction.paymentMetadata = {
      ...(transaction.paymentMetadata || {}),
      approvedBy: req.user._id,
      approvedAt: new Date(),
      adminNote: req.body?.note || '',
    };
    await transaction.save();

    res.status(200).json({ message: 'Withdrawal approved', transaction });
  } catch (error) {
    next(error);
  }
};

export const rejectWithdrawal = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject withdrawal requests' });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.withdrawalId,
      type: 'withdrawal',
      status: 'pending',
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Pending withdrawal request not found' });
    }

    const { account, model } = await findAccountByIdAndRole(
      transaction.fromUser,
      transaction.paymentMetadata?.requesterRole || transaction.fromUserRole || 'freelancer',
    );

    if (account && model) {
      await model.findByIdAndUpdate(account._id, {
        $set: { balance: (account.balance || 0) + (transaction.amount || 0) },
      });
    }

    transaction.status = 'failed';
    transaction.description = 'Withdrawal rejected by admin';
    transaction.paymentMetadata = {
      ...(transaction.paymentMetadata || {}),
      rejectedBy: req.user._id,
      rejectedAt: new Date(),
      rejectionReason: req.body?.reason || '',
    };
    await transaction.save();

    res.status(200).json({ message: 'Withdrawal rejected and balance refunded', transaction });
  } catch (error) {
    next(error);
  }
};

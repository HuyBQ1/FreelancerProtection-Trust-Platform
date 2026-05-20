import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { findAccountByIdAndRole } from '../services/accountService.js';
import { createNotification } from '../services/notificationService.js';
import { formatMoney, parseMoneyAmount } from '../utils/money.js';

function requireAdmin(req) {
  if (req.user?.role !== 'admin') {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    throw error;
  }
}

function formatCurrency(amount) {
  return formatMoney(amount);
}

function parseMoney(value) {
  return parseMoneyAmount(value);
}

async function assertJobHasNoCompletedPayments(job) {
  if (isJobCompleted(job)) {
    const error = new Error('Cannot cancel contract because it has already been completed');
    error.statusCode = 409;
    throw error;
  }
}

async function refundPendingPaymentsForJob(job) {
  const pendingTransactions = await Transaction.find({
    jobId: job._id,
    status: 'pending',
    type: 'release',
  });

  const refundAmount = pendingTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  if (refundAmount > 0) {
    const { account: clientAccount, model: clientModel } = await findAccountByIdAndRole(job.clientId, 'client');

    if (clientAccount && clientModel) {
      await clientModel.findByIdAndUpdate(clientAccount._id, {
        $set: {
          balance: (clientAccount.balance || 0) + refundAmount,
        },
      });
    }
  }

  if (pendingTransactions.length > 0) {
    await Transaction.deleteMany({
      _id: { $in: pendingTransactions.map((transaction) => transaction._id) },
    });
  }

  return refundAmount;
}

function resetAcceptedJob(job) {
  const cancelledFreelancerId = job.assignedFreelancerId ? String(job.assignedFreelancerId) : '';
  if (cancelledFreelancerId) {
    job.proposals = (job.proposals || []).map((proposal) => (
      String(proposal.freelancerId) === cancelledFreelancerId
        ? { ...(proposal.toObject?.() || proposal), status: 'declined' }
        : (proposal.toObject?.() || proposal)
    ));
  }
  job.status = 'open';
  job.assignedFreelancerId = null;
  job.assignedFreelancerName = '';
  job.assignedFreelancerRole = '';
  job.acceptedAt = null;
  job.contractState = null;
}

function titleCase(value) {
  if (!value) return '';
  return `${value}`.charAt(0).toUpperCase() + `${value}`.slice(1);
}

function serializeAccount(account, fallbackRole, sourceRole = fallbackRole) {
  const role = account.role || fallbackRole;
  const status = account.isBanned ? 'Banned' : account.moderation?.status || 'Healthy';
  const risk = account.isBanned ? 'High' : account.moderation?.risk || 'Low';
  const displayName = account.fullName || account.companyName || account.email;

  return {
    id: account._id.toString(),
    name: displayName,
    email: account.email,
    avatar: account.avatar || '',
    companyName: account.companyName || account.settings?.clientProfile?.companyName || '',
    headline: account.headline || account.settings?.freelancerProfile?.headline || '',
    role: titleCase(role),
    roleKey: sourceRole,
    status,
    risk,
    warnings: account.warnings || 0,
    banned: Boolean(account.isBanned),
    contracts: 0,
    balance: formatCurrency(account.balance || 0),
    escrowBalance: formatCurrency(account.escrowBalance || 0),
    language: account.settings?.language || 'vi',
    bankAccount: account.settings?.bankAccount || {},
    clientProfile: account.settings?.clientProfile || {},
    freelancerProfile: account.settings?.freelancerProfile || {},
    reason: account.moderation?.reason || 'Live database account',
    createdAt: account.createdAt,
  };
}

function serializeJob(job) {
  const draftMilestones = Array.isArray(job.milestones) ? job.milestones : [];
  const contractMilestones = Array.isArray(job.contractState?.milestones) ? job.contractState.milestones : [];

  return {
    id: job._id.toString(),
    title: job.title,
    author: job.clientName,
    client: job.clientName,
    category: job.category || 'Job post',
    status: titleCase(job.moderationStatus || 'approved'),
    jobStatus: job.status,
    reports: 0,
    reason: job.moderationReason || 'Stored in MongoDB',
    budget: formatCurrency(parseMoney(job.budget)),
    description: job.description,
    skills: Array.isArray(job.skills) ? job.skills : [],
    milestones: draftMilestones.map((milestone, index) => ({
      id: `draft-${index}`,
      title: milestone.title || `Milestone ${index + 1}`,
      amount: formatCurrency(parseMoney(milestone.amount)),
      dueDate: milestone.dueDate || '',
      description: milestone.description || '',
      status: 'Pending',
    })),
    contractMilestones: contractMilestones.map((milestone, index) => ({
      id: `contract-${index}`,
      title: milestone.title?.vi || milestone.title?.en || `Milestone ${index + 1}`,
      amount: formatCurrency(parseMoney(milestone.amount)),
      dueDate: milestone.dueDate || '',
      description: milestone.submission?.note || milestone.reviewNote || '',
      status: milestone.status || 'Pending',
      submissionFileName: milestone.submission?.fileName || '',
      submittedAt: milestone.submission?.submittedAt || null,
    })),
    createdAt: job.createdAt,
  };
}

function isJobCompleted(job) {
  const milestones = Array.isArray(job.contractState?.milestones) ? job.contractState.milestones : [];

  return job.status === 'closed'
    || job.contractState?.status === 'Completed'
    || (milestones.length > 0 && milestones.every((milestone) => milestone.status === 'Approved'));
}

function serializeContract(job) {
  const state = isJobCompleted(job) ? 'Completed' : job.contractState?.status || (job.status === 'assigned' ? 'Active' : titleCase(job.status));
  const progress = job.contractState?.progress ?? 0;

  return {
    id: job._id.toString(),
    title: job.title,
    owner: `${job.clientName || 'Client'} / ${job.assignedFreelancerName || 'Unassigned freelancer'}`,
    amount: formatCurrency(parseMoney(job.budget)),
    state,
    progress: `${progress}%`,
    payoutRisk: state === 'Completed' ? 'Low' : 'Medium',
  };
}

function getAccountLabel(account) {
  if (!account) return 'Không xác định';
  const name = account.fullName || account.companyName || account.email || 'Không tên';
  return account.email ? `${name} (${account.email})` : name;
}

function buildAccountMap(accounts) {
  return new Map(accounts.map((account) => [account._id.toString(), account]));
}

function averageReviewRating(review) {
  const rating = review.rating || {};
  const values = [rating.communication, rating.quality, rating.timeliness, rating.professionalism]
    .map((value) => Number(value) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.length ? Math.round((total / values.length) * 10) / 10 : 0;
}

function serializeReview(review, accountById = new Map()) {
  const reviewer = review.reviewerId ? accountById.get(review.reviewerId.toString()) : null;
  const recipient = review.recipientId ? accountById.get(review.recipientId.toString()) : null;

  return {
    id: review._id.toString(),
    contractId: review.contractId?.toString?.() || '',
    milestoneId: review.milestoneId || '',
    reviewerId: review.reviewerId?.toString?.() || '',
    reviewerRole: review.reviewerRole || '',
    reviewerLabel: getAccountLabel(reviewer),
    recipientId: review.recipientId?.toString?.() || '',
    recipientLabel: getAccountLabel(recipient),
    rating: review.rating || {},
    averageRating: averageReviewRating(review),
    comment: review.comment || '',
    status: review.status || 'pending',
    visibility: review.visibility || 'public',
    createdAt: review.createdAt,
  };
}

function serializeDispute(review, accountById = new Map()) {
  const serialized = serializeReview(review, accountById);
  const severity = serialized.averageRating <= 2 ? 'High' : serialized.status === 'rejected' ? 'Medium' : 'Medium';

  return {
    ...serialized,
    title: `Tranh chấp đánh giá ${serialized.averageRating}/5`,
    severity,
    summary: serialized.comment || 'Đánh giá không có nội dung bình luận.',
  };
}

function serializeTransaction(transaction, accountById = new Map(), jobById = new Map()) {
  const direction = ['deposit', 'platform_fee'].includes(transaction.type) ? 'Incoming' : 'Outgoing';
  const fromAccount = transaction.fromUser ? accountById.get(transaction.fromUser.toString()) : null;
  const toAccount = transaction.toUser ? accountById.get(transaction.toUser.toString()) : null;
  const job = transaction.jobId ? jobById.get(transaction.jobId.toString()) : null;

  return {
    id: transaction._id.toString(),
    contract: transaction.description || `${titleCase(transaction.type)} transaction`,
    account: direction,
    amount: formatCurrency(transaction.amount),
    state: titleCase(transaction.status || 'completed'),
    reason: transaction.description || 'MongoDB transaction record',
    type: transaction.type,
    paymentMetadata: transaction.paymentMetadata || {},
    jobId: transaction.jobId ? transaction.jobId.toString() : '',
    projectTitle: job?.title || '',
    fromUserId: transaction.fromUser ? transaction.fromUser.toString() : '',
    toUserId: transaction.toUser ? transaction.toUser.toString() : '',
    fromUserLabel: getAccountLabel(fromAccount),
    toUserLabel: getAccountLabel(toAccount),
    createdAt: transaction.createdAt,
  };
}

function buildTrend({ jobs, reviews, transactions }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const inDay = (item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= date && createdAt < nextDate;
    };

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      disputes: reviews.filter((item) => item.status === 'pending' && inDay(item)).length,
      posts: jobs.filter(inDay).length,
      payments: transactions.filter(inDay).length,
    };
  });
}

function buildRiskDistribution(users) {
  const total = users.length || 1;
  const groups = [
    { label: 'Healthy', tone: 'bg-emerald-500', count: users.filter((user) => user.status === 'Healthy').length },
    { label: 'Monitor', tone: 'bg-amber-400', count: users.filter((user) => ['Monitor', 'Review'].includes(user.status)).length },
    { label: 'Escalated', tone: 'bg-rose-500', count: users.filter((user) => user.status === 'Escalated').length },
    { label: 'Banned', tone: 'bg-slate-800', count: users.filter((user) => user.banned).length },
  ];

  return groups.map((group) => ({
    ...group,
    value: Math.round((group.count / total) * 100),
  }));
}

export async function getAdminOverview(req, res) {
  requireAdmin(req);

  const [clients, freelancers, platformUsers, jobs, reviews, transactions] = await Promise.all([
    Client.find({}).sort({ createdAt: -1 }),
    Freelancer.find({}).sort({ createdAt: -1 }),
    User.find({}).sort({ createdAt: -1 }),
    Job.find({}).sort({ createdAt: -1 }),
    Review.find({}).sort({ createdAt: -1 }).limit(100),
    Transaction.find({}).sort({ createdAt: -1 }).limit(100),
  ]);

  const users = [
    ...clients.map((account) => serializeAccount(account, 'client', 'client')),
    ...freelancers.map((account) => serializeAccount(account, 'freelancer', 'freelancer')),
    ...platformUsers.map((account) => serializeAccount(account, account.role || 'admin', 'user')),
  ];
  const accountById = buildAccountMap([...clients, ...freelancers, ...platformUsers]);
  const jobById = new Map(jobs.map((job) => [job._id.toString(), job]));
  const posts = jobs.map(serializeJob);
  const contractJobs = jobs.filter((job) => ['assigned', 'closed'].includes(job.status) || job.contractState);
  const contracts = contractJobs.map(serializeContract);
  const completedContracts = contractJobs.filter(isJobCompleted).length;
  const serializedReviews = reviews.map((review) => serializeReview(review, accountById));
  const disputes = reviews
    .filter((review) => ['pending', 'rejected'].includes(review.status))
    .map((review) => serializeDispute(review, accountById));
  const payments = transactions.map((transaction) => serializeTransaction(transaction, accountById, jobById));
  const protectedVolume = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount || 0), 0);
  const adminFeeTotal = transactions
    .filter((transaction) => transaction.type === 'platform_fee')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  res.status(200).json({
    users,
    posts,
    jobs: posts,
    contracts,
    reviews: serializedReviews,
    disputes,
    payments,
    stats: {
      totalUsers: users.length,
      flaggedUsers: users.filter((user) => user.status !== 'Healthy').length,
      postsPending: posts.filter((post) => ['Pending', 'Flagged'].includes(post.status)).length,
      postsFlagged: posts.filter((post) => post.status === 'Flagged').length,
      totalContracts: contracts.length,
      completedContracts,
      openDisputes: disputes.length,
      highSeverityDisputes: disputes.filter((dispute) => dispute.severity === 'High').length,
      totalReviews: reviews.length,
      protectedVolume: formatCurrency(protectedVolume),
      adminFeeTotal: formatCurrency(adminFeeTotal),
      paymentActions: payments.filter((payment) => payment.state !== 'Completed').length,
    },
    charts: {
      moderationTrend: buildTrend({ jobs, reviews, transactions }),
      riskDistribution: buildRiskDistribution(users),
    },
  });
}

export async function updateUserModeration(req, res) {
  requireAdmin(req);

  const { role, userId } = req.params;
  const { action, status, reason } = req.body || {};
  const Model = role === 'client' ? Client : role === 'freelancer' ? Freelancer : User;
  const account = await Model.findById(userId);

  if (!account) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'warn') {
    account.warnings = (account.warnings || 0) + 1;
    account.moderation = {
      ...account.moderation,
      status: account.warnings >= 3 ? 'Escalated' : 'Review',
      risk: account.warnings >= 3 ? 'High' : 'Medium',
      reason: reason || account.moderation?.reason || 'Admin warning issued',
    };
  } else if (action === 'ban') {
    account.isBanned = true;
    account.moderation = {
      ...account.moderation,
      status: 'Banned',
      risk: 'High',
      reason: reason || account.moderation?.reason || 'Banned by admin',
    };
  } else if (action === 'unban') {
    account.isBanned = false;
    account.moderation = {
      ...account.moderation,
      status: account.warnings > 0 ? 'Review' : 'Healthy',
      risk: account.warnings >= 3 ? 'High' : account.warnings > 0 ? 'Medium' : 'Low',
      reason: reason || account.moderation?.reason || 'Unbanned by admin',
    };
  } else if (action === 'status') {
    account.moderation = {
      ...account.moderation,
      status: status || account.moderation?.status || 'Healthy',
      risk: status === 'Escalated' ? 'High' : status === 'Review' ? 'Medium' : account.moderation?.risk || 'Low',
      reason: reason || account.moderation?.reason || 'Updated by admin',
    };
  } else if (action === 'freezeBank') {
    account.set('settings.bankAccount.isFrozen', true);
    account.set('settings.bankAccount.frozenReason', reason || 'Tài khoản ngân hàng đã bị admin đóng băng');
    account.set('settings.bankAccount.frozenAt', new Date());
  } else if (action === 'unfreezeBank') {
    account.set('settings.bankAccount.isFrozen', false);
    account.set('settings.bankAccount.frozenReason', reason || '');
    account.set('settings.bankAccount.frozenAt', null);
  } else {
    const error = new Error('Unsupported moderation action');
    error.statusCode = 400;
    throw error;
  }

  await account.save();

  res.status(200).json({
    message: 'User moderation updated successfully',
    user: serializeAccount(account, role),
  });
}

export async function updateJobModeration(req, res) {
  requireAdmin(req);

  const { jobId } = req.params;
  const { moderationStatus, reason } = req.body || {};

  if (!['pending', 'approved', 'flagged', 'rejected'].includes(moderationStatus)) {
    const error = new Error('Invalid moderation status');
    error.statusCode = 400;
    throw error;
  }

  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      $set: {
        moderationStatus,
        moderationReason: reason || 'Updated by admin',
      },
    },
    { new: true },
  );

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    message: 'Job moderation updated successfully',
    post: serializeJob(job),
  });
}

export async function deleteAdminReview(req, res) {
  requireAdmin(req);

  const { reviewId } = req.params;
  const review = await Review.findByIdAndDelete(reviewId);

  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    message: 'Review deleted successfully',
    reviewId,
  });
}

export async function updateAdminReviewStatus(req, res) {
  requireAdmin(req);

  const { reviewId } = req.params;
  const { status } = req.body || {};

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    const error = new Error('Invalid review status');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.findByIdAndUpdate(reviewId, { $set: { status } }, { new: true });

  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  const [clients, freelancers, platformUsers] = await Promise.all([
    Client.find({}),
    Freelancer.find({}),
    User.find({}),
  ]);
  const accountById = buildAccountMap([...clients, ...freelancers, ...platformUsers]);

  res.status(200).json({
    message: 'Review status updated successfully',
    review: serializeReview(review, accountById),
    dispute: ['pending', 'rejected'].includes(review.status) ? serializeDispute(review, accountById) : null,
  });
}

export async function updateTransactionStatus(req, res) {
  requireAdmin(req);

  const { transactionId } = req.params;
  const { status } = req.body || {};

  if (!['pending', 'completed', 'failed'].includes(status)) {
    const error = new Error('Invalid transaction status');
    error.statusCode = 400;
    throw error;
  }

  const transaction = await Transaction.findByIdAndUpdate(transactionId, { $set: { status } }, { new: true });

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.statusCode = 404;
    throw error;
  }

  const [clients, freelancers, platformUsers, jobs] = await Promise.all([
    Client.find({}),
    Freelancer.find({}),
    User.find({}),
    Job.find({}),
  ]);
  const accountById = buildAccountMap([...clients, ...freelancers, ...platformUsers]);
  const jobById = new Map(jobs.map((job) => [job._id.toString(), job]));

  res.status(200).json({
    message: 'Transaction status updated successfully',
    payment: serializeTransaction(transaction, accountById, jobById),
  });
}

export async function cancelAdminContract(req, res) {
  requireAdmin(req);

  const { jobId } = req.params;
  const job = await Job.findById(jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.status !== 'assigned') {
    const error = new Error('Only active contracts can be cancelled');
    error.statusCode = 409;
    throw error;
  }

  await assertJobHasNoCompletedPayments(job);
  const cancelledFreelancerId = job.assignedFreelancerId;
  const refundedAmount = await refundPendingPaymentsForJob(job);
  resetAcceptedJob(job);
  await job.save();

  if (cancelledFreelancerId) {
    await createNotification({
      recipient: { _id: cancelledFreelancerId, role: 'freelancer' },
      actor: req.user,
      type: 'job_cancelled',
      title: 'Contract cancelled by admin',
      body: `"${job.title}" was cancelled by admin and returned to the marketplace.`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: { jobId: job._id.toString(), jobTitle: job.title, refundedAmount },
    });
  }

  res.status(200).json({
    message: 'Contract cancelled successfully',
    refundedAmount,
    jobId: job._id.toString(),
  });
}

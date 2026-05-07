import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

function requireAdmin(req) {
  if (req.user?.role !== 'admin') {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    throw error;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function parseMoney(value) {
  const parsed = Number.parseFloat(`${value || ''}`.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
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
    role: titleCase(role),
    roleKey: sourceRole,
    status,
    risk,
    warnings: account.warnings || 0,
    banned: Boolean(account.isBanned),
    contracts: 0,
    reason: account.moderation?.reason || 'Live database account',
    createdAt: account.createdAt,
  };
}

function serializeJob(job) {
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
    budget: job.budget,
    description: job.description,
    skills: Array.isArray(job.skills) ? job.skills : [],
    createdAt: job.createdAt,
  };
}

function serializeContract(job) {
  const state = job.contractState?.status || (job.status === 'assigned' ? 'Active' : titleCase(job.status));
  const progress = job.contractState?.progress ?? 0;

  return {
    id: job._id.toString(),
    title: job.title,
    owner: `${job.clientName || 'Client'} / ${job.assignedFreelancerName || 'Unassigned freelancer'}`,
    amount: job.budget,
    state,
    progress: `${progress}%`,
    payoutRisk: state === 'Completed' ? 'Low' : 'Medium',
  };
}

function serializeTransaction(transaction) {
  const direction = transaction.type === 'deposit' ? 'Incoming' : 'Outgoing';

  return {
    id: transaction._id.toString(),
    contract: transaction.description || `${titleCase(transaction.type)} transaction`,
    account: direction,
    amount: formatCurrency(transaction.amount),
    state: titleCase(transaction.status || 'completed'),
    reason: transaction.description || 'MongoDB transaction record',
    type: transaction.type,
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
  const posts = jobs.map(serializeJob);
  const contracts = jobs.filter((job) => job.status === 'assigned').map(serializeContract);
  const payments = transactions.map(serializeTransaction);
  const protectedVolume = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount || 0), 0);

  res.status(200).json({
    users,
    posts,
    jobs: posts,
    contracts,
    disputes: reviews
      .filter((review) => review.status === 'pending')
      .map((review) => ({
        id: review._id.toString(),
        title: 'Review moderation request',
        severity: 'Medium',
        age: review.createdAt,
        summary: review.comment || 'Pending review from MongoDB',
        status: 'Under Review',
      })),
    payments,
    stats: {
      totalUsers: users.length,
      flaggedUsers: users.filter((user) => user.status !== 'Healthy').length,
      postsPending: posts.filter((post) => ['Pending', 'Flagged'].includes(post.status)).length,
      postsFlagged: posts.filter((post) => post.status === 'Flagged').length,
      openDisputes: reviews.filter((review) => review.status === 'pending').length,
      highSeverityDisputes: 0,
      protectedVolume: formatCurrency(protectedVolume),
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

  res.status(200).json({
    message: 'Transaction status updated successfully',
    payment: serializeTransaction(transaction),
  });
}

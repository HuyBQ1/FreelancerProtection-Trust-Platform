import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from '../services/accountService.js';

function parseBudgetNumber(budget) {
  const normalized = `${budget || ''}`.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDisplayDate(dateLike) {
  if (!dateLike) {
    return 'Open';
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'Open';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildDefaultContractState(job) {
  const customMilestones = Array.isArray(job.milestones)
    ? job.milestones
        .map((milestone, index) => ({
          title: {
            en: `${milestone.title || `Milestone ${index + 1}`}`.trim(),
            vi: `${milestone.title || `Milestone ${index + 1}`}`.trim(),
          },
          dueDate: milestone.dueDate || (index === 0 ? formatDisplayDate(job.acceptedAt || job.createdAt) : job.timeline || 'Flexible'),
          amount: milestone.amount || '$0',
          status: index === 0 ? 'In Progress' : 'Pending',
          action: index === 0 ? 'Submit Work' : null,
          reviewAction: index === 0 ? 'View Brief' : null,
          reviewNote: milestone.description || (index === 0
            ? job.scopeSummary || 'Start by aligning on scope, deliverables, and the first approval checkpoint.'
            : 'This milestone will move forward once the previous phase is approved.'),
          submission: {
            fileName: '',
            fileType: '',
            fileDataUrl: '',
            note: '',
            submittedAt: null,
          },
        }))
        .filter((milestone) => milestone.title.en && milestone.amount)
    : [];

  if (customMilestones.length > 0) {
    return {
      status: 'Active',
      progress: 0,
      completedMilestones: 0,
      totalMilestones: customMilestones.length,
      earned: '$0',
      milestones: customMilestones,
    };
  }

  const totalBudget = parseBudgetNumber(job.budget);
  const kickoffAmount = totalBudget > 0 ? Math.round(totalBudget * 0.4) : 0;
  const finalAmount = totalBudget > 0 ? totalBudget - kickoffAmount : 0;
  const acceptedAt = job.acceptedAt || job.createdAt;

  return {
    status: 'Active',
    progress: 0,
    completedMilestones: 0,
    totalMilestones: 2,
    earned: '$0',
    milestones: [
      {
        title: {
          en: 'Kickoff and scope alignment',
          vi: 'Kickoff and scope alignment',
        },
        dueDate: formatDisplayDate(acceptedAt),
        amount: kickoffAmount > 0 ? formatCurrency(kickoffAmount) : job.budget,
        status: 'In Progress',
        action: 'Submit Work',
        reviewAction: 'View Brief',
        reviewNote: job.scopeSummary || 'Start by aligning on scope, deliverables, and the first approval checkpoint.',
        submission: {
          fileName: '',
          fileType: '',
          fileDataUrl: '',
          note: '',
          submittedAt: null,
        },
      },
      {
        title: {
          en: 'Final delivery and approval',
          vi: 'Final delivery and approval',
        },
        dueDate: job.timeline || 'Flexible',
        amount: finalAmount > 0 ? formatCurrency(finalAmount) : job.budget,
        status: 'Pending',
        action: null,
        reviewAction: null,
        reviewNote: 'This milestone will move forward once the kickoff phase is approved.',
        submission: {
          fileName: '',
          fileType: '',
          fileDataUrl: '',
          note: '',
          submittedAt: null,
        },
      },
    ],
  };
}

function computeContractMeta(milestones) {
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const totalMilestones = safeMilestones.length;
  const completedMilestones = safeMilestones.filter((milestone) => ['Approved', 'Completed'].includes(milestone.status)).length;
  const earnedAmount = safeMilestones.reduce((sum, milestone) => {
    if (milestone.status !== 'Approved') {
      return sum;
    }

    return sum + parseBudgetNumber(milestone.amount);
  }, 0);

  return {
    status: totalMilestones > 0 && safeMilestones.every((milestone) => milestone.status === 'Approved') ? 'Completed' : 'Active',
    progress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
    completedMilestones,
    totalMilestones,
    earned: formatCurrency(earnedAmount),
  };
}

function normalizeContractState(job) {
  const baseState = job.contractState?.milestones?.length ? job.contractState.toObject?.() || job.contractState : buildDefaultContractState(job);
  const meta = computeContractMeta(baseState.milestones);

  return {
    ...baseState,
    ...meta,
  };
}

function serializeJob(job) {
  return {
    id: job._id.toString(),
    clientId: job.clientId?.toString?.() || '',
    title: job.title,
    description: job.description,
    category: job.category,
    budget: job.budget,
    experienceLevel: job.experienceLevel || '',
    timeline: job.timeline || '',
    locationType: job.locationType || '',
    engagementType: job.engagementType || '',
    scopeSummary: job.scopeSummary || '',
    skills: Array.isArray(job.skills) ? job.skills : [],
    milestones: Array.isArray(job.milestones) ? job.milestones : [],
    client: job.clientName,
    status: job.status,
    assignedFreelancerId: job.assignedFreelancerId?.toString?.() || '',
    assignedFreelancerName: job.assignedFreelancerName || '',
    assignedFreelancerRole: job.assignedFreelancerRole || '',
    acceptedAt: job.acceptedAt,
    createdAt: job.createdAt,
    contractState: ['assigned', 'closed'].includes(job.status) ? normalizeContractState(job) : null,
  };
}

function normalizeJobPayload(payload) {
  const {
    title,
    description,
    category,
    budget,
    experienceLevel,
    timeline,
    locationType,
    engagementType,
    scopeSummary,
    skills,
    milestones,
  } = payload || {};

  if (!title?.trim() || !description?.trim() || !category?.trim() || !budget?.trim()) {
    const error = new Error('Title, description, category, and budget are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    budget: budget.trim(),
    experienceLevel: typeof experienceLevel === 'string' ? experienceLevel.trim() : '',
    timeline: typeof timeline === 'string' ? timeline.trim() : '',
    locationType: typeof locationType === 'string' ? locationType.trim() : '',
    engagementType: typeof engagementType === 'string' ? engagementType.trim() : '',
    scopeSummary: typeof scopeSummary === 'string' ? scopeSummary.trim() : '',
    skills: Array.isArray(skills)
      ? skills.map((skill) => `${skill}`.trim()).filter(Boolean)
      : [],
    milestones: Array.isArray(milestones)
      ? milestones
          .map((milestone) => ({
            title: `${milestone?.title || ''}`.trim(),
            amount: `${milestone?.amount || ''}`.trim(),
            dueDate: `${milestone?.dueDate || ''}`.trim(),
            description: `${milestone?.description || ''}`.trim(),
          }))
          .filter((milestone) => milestone.title && milestone.amount)
      : [],
  };
}

export async function createJob(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can create jobs');
    error.statusCode = 403;
    throw error;
  }

  const normalizedPayload = normalizeJobPayload(req.body);

  const job = await Job.create({
    ...normalizedPayload,
    clientId: req.user._id,
    clientName: req.user.companyName || req.user.fullName || req.user.email,
  });

  res.status(201).json({
    message: 'Job created successfully',
    job: serializeJob(job),
  });
}

export async function getJobById(req, res) {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = req.user?.role === 'client' && String(job.clientId) === String(req.user._id);
  const isAssignedFreelancer = req.user?.role === 'freelancer' && String(job.assignedFreelancerId) === String(req.user._id);

  if (job.status !== 'open' && !isOwner && !isAssignedFreelancer) {
    const error = new Error('You do not have access to this job');
    error.statusCode = 403;
    throw error;
  }

  res.status(200).json({
    message: 'Job fetched successfully',
    job: serializeJob(job),
  });
}

export async function updateJob(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can edit job posts');
    error.statusCode = 403;
    throw error;
  }

  const job = await Job.findById(req.params.jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (String(job.clientId) !== String(req.user._id)) {
    const error = new Error('You can only edit your own job posts');
    error.statusCode = 403;
    throw error;
  }

  if (job.status === 'closed') {
    const error = new Error('Closed jobs cannot be edited');
    error.statusCode = 409;
    throw error;
  }

  const normalizedPayload = normalizeJobPayload(req.body);
  Object.assign(job, normalizedPayload);

  if (job.status === 'open') {
    job.contractState = null;
  }

  await job.save();

  res.status(200).json({
    message: 'Job updated successfully',
    job: serializeJob(job),
  });
}

export async function getPublicJobs(req, res) {
  const jobs = await Job.find({ status: 'open' }).sort({ createdAt: -1 }).limit(100);

  res.status(200).json({
    message: 'Jobs fetched successfully',
    jobs: jobs.map(serializeJob),
  });
}

export async function getMyJobs(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can view their job posts');
    error.statusCode = 403;
    throw error;
  }

  const jobs = await Job.find({ clientId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    message: 'Client jobs fetched successfully',
    jobs: jobs.map(serializeJob),
  });
}

export async function getAssignedJobs(req, res) {
  if (req.user.role !== 'freelancer') {
    const error = new Error('Only freelancers can view their accepted jobs');
    error.statusCode = 403;
    throw error;
  }

  const jobs = await Job.find({
    assignedFreelancerId: req.user._id,
    status: { $in: ['assigned', 'closed'] },
  }).sort({ acceptedAt: -1, createdAt: -1 });

  res.status(200).json({
    message: 'Accepted freelancer jobs fetched successfully',
    jobs: jobs.map(serializeJob),
  });
}

export async function acceptJob(req, res) {
  if (req.user.role !== 'freelancer') {
    const error = new Error('Only freelancers can accept jobs');
    error.statusCode = 403;
    throw error;
  }

  const job = await Job.findById(req.params.jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.status === 'assigned' && String(job.assignedFreelancerId) !== String(req.user._id)) {
    const error = new Error('This job has already been accepted by another freelancer');
    error.statusCode = 409;
    throw error;
  }

  if (job.status === 'assigned' && String(job.assignedFreelancerId) === String(req.user._id)) {
    res.status(200).json({
      message: 'Job already accepted',
      job: serializeJob(job),
    });
    return;
  }

  job.status = 'assigned';
  job.assignedFreelancerId = req.user._id;
  job.assignedFreelancerName = req.user.fullName || req.user.email;
  job.assignedFreelancerRole = 'freelancer';
  job.acceptedAt = new Date();
  job.contractState = buildDefaultContractState(job);

  await job.save();

  res.status(200).json({
    message: 'Job accepted successfully',
    job: serializeJob(job),
  });
}

export async function updateJobContractMilestone(req, res) {
  const { jobId, milestoneIndex } = req.params;
  const { actionType, submission } = req.body || {};

  if (!['submit', 'approve'].includes(actionType)) {
    const error = new Error('Unsupported contract action');
    error.statusCode = 400;
    throw error;
  }

  const job = await Job.findById(jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.status !== 'assigned') {
    const error = new Error('Only accepted jobs can update contract milestones');
    error.statusCode = 409;
    throw error;
  }

  const index = Number.parseInt(milestoneIndex, 10);
  if (!Number.isInteger(index) || index < 0) {
    const error = new Error('Invalid milestone index');
    error.statusCode = 400;
    throw error;
  }

  if (actionType === 'submit') {
    if (req.user.role !== 'freelancer' || String(job.assignedFreelancerId) !== String(req.user._id)) {
      const error = new Error('Only the assigned freelancer can submit contract work');
      error.statusCode = 403;
      throw error;
    }
  }

  if (actionType === 'approve') {
    if (req.user.role !== 'client' || String(job.clientId) !== String(req.user._id)) {
      const error = new Error('Only the client who posted this job can approve milestones');
      error.statusCode = 403;
      throw error;
    }
  }

  const contractState = normalizeContractState(job);
  const milestones = contractState.milestones.map((milestone) => ({
    ...milestone,
    title: { ...milestone.title },
  }));
  const target = milestones[index];

  if (!target) {
    const error = new Error('Milestone not found');
    error.statusCode = 404;
    throw error;
  }

  if (actionType === 'submit') {
    if (!['In Progress', 'Pending'].includes(target.status)) {
      const error = new Error('This milestone cannot be submitted right now');
      error.statusCode = 409;
      throw error;
    }

    target.status = 'Completed';
    target.action = 'Approve';
    target.reviewAction = 'Review Product';
    target.reviewNote = 'Submission received and ready for client review.';
    target.submission = {
      fileName: `${submission?.fileName || ''}`.trim(),
      fileType: `${submission?.fileType || ''}`.trim(),
      fileDataUrl: `${submission?.fileDataUrl || ''}`.trim(),
      note: `${submission?.note || ''}`.trim(),
      submittedAt: new Date(),
    };

    const nextMilestone = milestones[index + 1];
    if (nextMilestone && nextMilestone.status === 'Pending') {
      nextMilestone.status = 'In Progress';
      nextMilestone.action = 'Submit Work';
      nextMilestone.reviewAction = 'View Draft';
      nextMilestone.reviewNote = 'This next phase is now open for delivery.';
      nextMilestone.submission = nextMilestone.submission || {
        fileName: '',
        fileType: '',
        fileDataUrl: '',
        note: '',
        submittedAt: null,
      };
    }
  }

  if (actionType === 'approve') {
    if (!['Completed', 'In Progress'].includes(target.status)) {
      const error = new Error('This milestone is not ready for approval');
      error.statusCode = 409;
      throw error;
    }

    target.status = 'Approved';
    target.action = null;
    target.reviewAction = 'View Product';
    target.reviewNote = 'Approved by the client and recorded in the contract history.';

    const nextMilestone = milestones[index + 1];
    if (nextMilestone && nextMilestone.status === 'Pending') {
      nextMilestone.status = 'In Progress';
      nextMilestone.action = 'Submit Work';
      nextMilestone.reviewAction = 'View Draft';
      nextMilestone.reviewNote = 'This milestone is now ready for freelancer delivery.';
    }

    const approvedAmount = parseBudgetNumber(target.amount);

    if (approvedAmount > 0) {
      const { account: freelancerAccount, model: freelancerModel } = await findAccountByIdAndRole(job.assignedFreelancerId, 'freelancer');

      if (freelancerAccount && freelancerModel) {
        const nextFreelancerBalance = (freelancerAccount.balance || 0) + approvedAmount;
        await freelancerModel.findByIdAndUpdate(freelancerAccount._id, {
          $set: { balance: nextFreelancerBalance },
        });
      }

      if (req.accountModel && req.user?._id) {
        const currentBalance = req.user.balance || 0;
        if (currentBalance < approvedAmount) {
          const error = new Error('Insufficient available balance to approve and pay this milestone');
          error.statusCode = 400;
          throw error;
        }

        const nextBalance = currentBalance - approvedAmount;
        req.user.balance = nextBalance;
        await req.accountModel.findByIdAndUpdate(req.user._id, {
          $set: { balance: nextBalance },
        });
      }

      await Transaction.create({
        type: 'release',
        amount: approvedAmount,
        fromUser: req.user._id,
        toUser: job.assignedFreelancerId,
        description: `Milestone approved and paid for job: ${job.title}`,
      });
    }
  }

  job.contractState = {
    ...contractState,
    milestones,
    ...computeContractMeta(milestones),
  };

  await job.save();

  res.status(200).json({
    message: actionType === 'submit' ? 'Milestone submitted successfully' : 'Milestone approved successfully',
    job: serializeJob(job),
  });
}

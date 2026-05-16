import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from '../services/accountService.js';
import { assertNoBlockingDispute } from '../services/disputeService.js';
import { createNotification } from '../services/notificationService.js';
import { assertClientCanReservePendingPayments, ensurePendingPaymentsForJob } from '../services/pendingPaymentService.js';
import { formatMoney, parseMoneyAmount } from '../utils/money.js';

function parseBudgetNumber(budget) {
  return parseMoneyAmount(budget);
}

function parseStrictMoney(value, fieldLabel) {
  const rawValue = `${value || ''}`.trim();

  if (!/^\d+$/.test(rawValue)) {
    const error = new Error(`${fieldLabel} must be a whole VND amount`);
    error.statusCode = 400;
    throw error;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error(`${fieldLabel} must be greater than 0`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function formatCurrency(amount) {
  return formatMoney(amount);
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

function serializeProposal(proposal) {
  return {
    id: proposal._id?.toString?.() || '',
    freelancerId: proposal.freelancerId?.toString?.() || '',
    freelancerName: proposal.freelancerName || '',
    freelancerEmail: proposal.freelancerEmail || '',
    bidAmount: proposal.bidAmount || 0,
    bidDisplay: formatCurrency(proposal.bidAmount || 0),
    timeline: proposal.timeline || '',
    coverLetter: proposal.coverLetter || '',
    status: proposal.status || 'pending',
    submittedAt: proposal.submittedAt || proposal.createdAt || null,
  };
}

function serializeMilestone(milestone) {
  const milestoneObject = milestone.toObject?.() || milestone;

  return {
    ...milestoneObject,
    amount: formatCurrency(parseBudgetNumber(milestone.amount)),
  };
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
          amount: milestone.amount || formatCurrency(0),
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
      earned: formatCurrency(0),
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
    earned: formatCurrency(0),
    milestones: [
      {
        title: {
          en: 'Kickoff and scope alignment',
          vi: 'Khởi động và thống nhất phạm vi',
        },
        dueDate: formatDisplayDate(acceptedAt),
        amount: kickoffAmount > 0 ? formatCurrency(kickoffAmount) : job.budget,
        status: 'In Progress',
        action: 'Submit Work',
        reviewAction: 'View Brief',
        reviewNote: job.scopeSummary || 'Bắt đầu bằng việc thống nhất phạm vi, sản phẩm bàn giao và mốc phê duyệt đầu tiên.',
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
          vi: 'Bàn giao cuối cùng và phê duyệt',
        },
        dueDate: job.timeline || 'Flexible',
        amount: finalAmount > 0 ? formatCurrency(finalAmount) : job.budget,
        status: 'Pending',
        action: null,
        reviewAction: null,
        reviewNote: 'Milestone này sẽ được mở khi giai đoạn khởi động đã được phê duyệt.',
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

async function assertJobHasNoCompletedPayments(job) {
  const completedPayment = await Transaction.findOne({
    type: 'release',
    status: 'completed',
    jobId: job._id,
  });

  if (completedPayment) {
    const error = new Error('This job already has completed payments and cannot be cancelled');
    error.statusCode = 409;
    throw error;
  }
}

async function refundPendingPaymentsForJob(job) {
  const pendingTransactions = await Transaction.find({
    type: 'release',
    status: 'pending',
    jobId: job._id,
    fromUser: job.clientId,
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
  job.status = 'open';
  job.assignedFreelancerId = null;
  job.assignedFreelancerName = '';
  job.assignedFreelancerRole = '';
  job.acceptedAt = null;
  job.contractState = null;
}

function serializeJob(job) {
  const onlineContractStatus = hasBothOnlineContractSignatures(job) ? 'signed' : (job.onlineContract?.status || 'pending_signature');

  return {
    id: job._id.toString(),
    clientId: job.clientId?.toString?.() || '',
    title: job.title,
    description: job.description,
    category: job.category,
    budget: formatCurrency(parseBudgetNumber(job.budget)),
    experienceLevel: job.experienceLevel || '',
    timeline: job.timeline || '',
    locationType: job.locationType || '',
    engagementType: job.engagementType || '',
    scopeSummary: job.scopeSummary || '',
    skills: Array.isArray(job.skills) ? job.skills : [],
    milestones: Array.isArray(job.milestones) ? job.milestones.map(serializeMilestone) : [],
    client: job.clientName,
    status: job.status,
    assignedFreelancerId: job.assignedFreelancerId?.toString?.() || '',
    assignedFreelancerName: job.assignedFreelancerName || '',
    assignedFreelancerRole: job.assignedFreelancerRole || '',
    acceptedAt: job.acceptedAt,
    createdAt: job.createdAt,
    onlineContract: job.onlineContract ? {
      status: onlineContractStatus,
      title: job.onlineContract.title || '',
      content: job.onlineContract.content || '',
      clientAcceptedAt: job.onlineContract.clientAcceptedAt || null,
      clientSignedAt: job.onlineContract.clientSignedAt || null,
      clientSignature: job.onlineContract.clientSignature || '',
      clientSignatureImage: job.onlineContract.clientSignatureImage || '',
      freelancerSignedAt: job.onlineContract.freelancerSignedAt || null,
      freelancerSignature: job.onlineContract.freelancerSignature || '',
      freelancerSignatureImage: job.onlineContract.freelancerSignatureImage || '',
    } : null,
    contractState: ['assigned', 'closed'].includes(job.status) ? normalizeContractState(job) : null,
    proposals: Array.isArray(job.proposals) ? job.proposals.map(serializeProposal) : [],
  };
}

function buildOnlineContract(job, freelancerAccount) {
  const clientName = job.clientName || 'Client';
  const freelancerName = freelancerAccount.fullName || freelancerAccount.email || 'Freelancer';
  const milestoneLines = (job.milestones || [])
    .map((milestone, index) => `${index + 1}. ${milestone.title} - ${milestone.amount} - ${milestone.dueDate || 'Không cố định'}`)
    .join('\n');

  return {
    status: 'pending_signature',
    title: `Hợp đồng online - ${job.title}`,
    content: [
      `Hợp đồng online giữa ${clientName} và ${freelancerName}.`,
      `Dự án: ${job.title}.`,
      `Ngân sách: ${job.budget}.`,
      `Phạm vi: ${job.scopeSummary || job.description}.`,
      'Milestone:',
      milestoneLines || 'Theo mô tả công việc đã đăng.',
      'Freelancer cam kết chỉ bắt đầu công việc sau khi hợp đồng này được xác nhận bởi hai bên và milestone đầu tiên được thiết lập trên nền tảng. Freelancer có trách nhiệm hoàn thành công việc đúng phạm vi đã thống nhất, bảo đảm chất lượng source code, maintainable structure, hiệu suất ổn định và bàn giao đúng tiến độ theo timeline đã đề ra. Trong trường hợp phát hiện lỗi thuộc phạm vi đã bàn giao, freelancer cam kết hỗ trợ sửa lỗi hợp lý trong vòng 14 ngày kể từ ngày nghiệm thu milestone cuối cùng.',
      'Client cam kết cung cấp đầy đủ thông tin, tài liệu, quyền truy cập hệ thống, yêu cầu kỹ thuật và phản hồi trong thời gian hợp lý để không ảnh hưởng đến tiến độ phát triển. Nếu client chậm phản hồi quá 3 ngày làm việc, timeline dự án có thể được điều chỉnh tương ứng mà không tính là chậm tiến độ từ phía freelancer.',
      'Việc thanh toán được thực hiện theo từng milestone đã thống nhất. Sau khi freelancer hoàn thành milestone và gửi bản bàn giao, client có tối đa 3 ngày làm việc để kiểm tra, đánh giá và phản hồi. Nếu không có phản hồi trong khoảng thời gian này, milestone có thể được xem là đã được chấp thuận theo tiến độ thực tế của dự án. Khoản thanh toán milestone phải được xử lý sau khi nghiệm thu thành công.',
      'Các yêu cầu thay đổi lớn về tính năng, thiết kế, logic hệ thống hoặc phát sinh ngoài phạm vi ban đầu sẽ không được tính trong ngân sách hiện tại và có thể yêu cầu timeline hoặc chi phí bổ sung dựa trên thỏa thuận mới giữa hai bên. Những chỉnh sửa nhỏ liên quan đến UI, bug fix hoặc logic đúng theo yêu cầu ban đầu sẽ được hỗ trợ trong phạm vi hợp lý.',
      'Freelancer có quyền tạm dừng công việc nếu client không thanh toán đúng milestone đã cam kết, thay đổi phạm vi công việc liên tục mà không thống nhất hoặc không phản hồi trong thời gian kéo dài gây ảnh hưởng trực tiếp đến tiến độ dự án. Client có quyền yêu cầu cập nhật tiến độ định kỳ và nhận báo cáo công việc trong quá trình phát triển.',
      'Toàn bộ source code, tài liệu kỹ thuật và sản phẩm thuộc phạm vi dự án sẽ được bàn giao cho client sau khi hoàn tất thanh toán đầy đủ. Trước thời điểm thanh toán hoàn tất, freelancer vẫn giữ quyền quản lý đối với source code và môi trường triển khai đang sử dụng cho dự án.',
      'Hai bên cam kết giữ bảo mật các thông tin nội bộ, source code, database structure, business logic, dữ liệu người dùng và những tài nguyên liên quan đến dự án. Không bên nào được chia sẻ hoặc sử dụng các thông tin này cho mục đích bên ngoài nếu chưa có sự đồng ý của bên còn lại.',
      'Trong trường hợp xảy ra tranh chấp, hai bên ưu tiên giải quyết thông qua trao đổi thiện chí và thương lượng. Nếu không đạt được thỏa thuận, vấn đề sẽ được xem xét theo quy định của nền tảng làm việc hoặc hình thức giải quyết được cả hai bên thống nhất.',
      'Hợp đồng online này có hiệu lực kể từ thời điểm hai bên xác nhận đồng ý thông qua nền tảng làm việc, email hoặc tin nhắn xác nhận chính thức.',
    ].join('\n\n'),
    clientAcceptedAt: new Date(),
    clientSignedAt: null,
    clientSignature: '',
    clientSignatureImage: '',
    clientSignedIp: '',
    freelancerSignedAt: null,
    freelancerSignature: '',
    freelancerSignatureImage: '',
    freelancerSignedIp: '',
  };
}

function hasBothOnlineContractSignatures(job) {
  return Boolean(job.onlineContract?.clientSignature && job.onlineContract?.freelancerSignature);
}

async function finalizeOnlineContractIfReady(job) {
  if (!hasBothOnlineContractSignatures(job)) {
    job.onlineContract.status = 'pending_signature';
    return null;
  }

  if (job.onlineContract.status !== 'signed') {
    await assertClientCanReservePendingPayments(job);
    job.onlineContract.status = 'signed';
    job.acceptedAt = new Date();
    job.contractState = buildDefaultContractState(job);
    await job.save();
  } else if (!job.contractState) {
    job.contractState = buildDefaultContractState(job);
    await job.save();
  }

  return ensurePendingPaymentsForJob(job, { strict: true });
}

async function assignJobToFreelancer(job, freelancerAccount) {
  if (job.status === 'assigned' && String(job.assignedFreelancerId) !== String(freelancerAccount._id)) {
    const error = new Error('This job has already been accepted by another freelancer');
    error.statusCode = 409;
    throw error;
  }

  if (job.status === 'assigned' && String(job.assignedFreelancerId) === String(freelancerAccount._id)) {
    const isSigned = job.onlineContract?.status === 'signed' && hasBothOnlineContractSignatures(job);
    const pendingReservation = isSigned ? await ensurePendingPaymentsForJob(job, { strict: true }) : null;
    return {
      job,
      pendingReservation,
      alreadyAccepted: true,
    };
  }

  if (job.status !== 'open') {
    const error = new Error('This job is not available to accept');
    error.statusCode = 409;
    throw error;
  }

  job.status = 'assigned';
  job.assignedFreelancerId = freelancerAccount._id;
  job.assignedFreelancerName = freelancerAccount.fullName || freelancerAccount.email;
  job.assignedFreelancerRole = 'freelancer';
  job.acceptedAt = null;
  job.contractState = null;
  job.onlineContract = buildOnlineContract(job, freelancerAccount);
  job.proposals = (job.proposals || []).map((proposal) => ({
    ...proposal.toObject?.() || proposal,
    status: String(proposal.freelancerId) === String(freelancerAccount._id) ? 'accepted' : 'declined',
  }));

  try {
    await job.save();
    return {
      job,
      pendingReservation: null,
      alreadyAccepted: false,
    };
  } catch (error) {
    job.status = 'open';
    job.assignedFreelancerId = null;
    job.assignedFreelancerName = '';
    job.assignedFreelancerRole = '';
    job.acceptedAt = null;
    job.contractState = null;
    job.onlineContract = null;
    job.proposals = (job.proposals || []).map((proposal) => ({
      ...proposal.toObject?.() || proposal,
      status: 'pending',
    }));
    await job.save().catch(() => {});
    throw error;
  }
}

function applyClientMilestoneSplitToJob(job, proposal, milestoneDrafts) {
  if (!Array.isArray(milestoneDrafts) || milestoneDrafts.length === 0) {
    const error = new Error('Milestone payment split is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedMilestones = milestoneDrafts.map((milestone, index) => {
    const amount = parseStrictMoney(milestone.amount, `Milestone ${index + 1} amount`);
    const title = `${milestone.title || `Milestone ${index + 1}`}`.trim();

    if (!title) {
      const error = new Error(`Milestone ${index + 1} title is required`);
      error.statusCode = 400;
      throw error;
    }

    return {
      title,
      amountValue: amount,
      amount: formatCurrency(amount),
      dueDate: `${milestone.dueDate || proposal.timeline || job.timeline || ''}`.trim(),
      description: `${milestone.description || ''}`.trim(),
    };
  });

  const milestoneTotal = normalizedMilestones.reduce((sum, milestone) => sum + milestone.amountValue, 0);
  if (milestoneTotal !== (proposal.bidAmount || 0)) {
    const error = new Error('Milestone total must match the selected proposal amount');
    error.statusCode = 400;
    throw error;
  }

  job.budget = formatCurrency(proposal.bidAmount || 0);
  job.timeline = proposal.timeline || job.timeline;
  job.milestones = normalizedMilestones.map(({ amountValue, ...milestone }) => milestone);
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

  const budgetAmount = parseStrictMoney(budget, 'Budget');
  const normalizedMilestones = Array.isArray(milestones)
    ? milestones
        .map((milestone) => {
          const title = `${milestone?.title || ''}`.trim();
          const amountValue = `${milestone?.amount || ''}`.trim();

          if (!title && !amountValue) {
            return null;
          }

          return {
            title,
            amount: formatCurrency(parseStrictMoney(amountValue, 'Milestone amount')),
            dueDate: `${milestone?.dueDate || ''}`.trim(),
            description: `${milestone?.description || ''}`.trim(),
          };
        })
        .filter(Boolean)
    : [];

  if (normalizedMilestones.length === 0) {
    const error = new Error('Please add at least one milestone with a title and payment amount');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedMilestones.some((milestone) => !milestone.title)) {
    const error = new Error('Every milestone needs a title');
    error.statusCode = 400;
    throw error;
  }

  const milestoneTotal = normalizedMilestones.reduce((sum, milestone) => sum + parseBudgetNumber(milestone.amount), 0);
  if (Math.abs(milestoneTotal - budgetAmount) > 0.01) {
    const error = new Error('Milestone total must equal the job budget');
    error.statusCode = 400;
    throw error;
  }

  return {
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    budget: formatCurrency(budgetAmount),
    experienceLevel: typeof experienceLevel === 'string' ? experienceLevel.trim() : '',
    timeline: typeof timeline === 'string' ? timeline.trim() : '',
    locationType: typeof locationType === 'string' ? locationType.trim() : '',
    engagementType: typeof engagementType === 'string' ? engagementType.trim() : '',
    scopeSummary: typeof scopeSummary === 'string' ? scopeSummary.trim() : '',
    skills: Array.isArray(skills)
      ? skills.map((skill) => `${skill}`.trim()).filter(Boolean)
      : [],
    milestones: normalizedMilestones,
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

export async function getCompletedFreelancerJobs(req, res) {
  const freelancerId = req.params.freelancerId || req.user._id;

  const jobs = await Job.find({
    assignedFreelancerId: freelancerId,
    status: { $in: ['assigned', 'closed'] },
  }).sort({ updatedAt: -1, createdAt: -1 });

  const completedJobs = jobs
    .map((job) => serializeJob(job))
    .filter((job) => {
      if (job.status === 'closed') {
        return true;
      }

      const contractState = job.contractState || {};
      if (contractState.status === 'Completed') {
        return true;
      }

      if (Number(contractState.progress || 0) >= 100) {
        return true;
      }

      const milestones = Array.isArray(contractState.milestones) ? contractState.milestones : [];
      return milestones.length > 0 && milestones.every((milestone) => milestone.status === 'Approved');
    });

  res.status(200).json({
    message: 'Completed freelancer jobs fetched successfully',
    jobs: completedJobs,
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

  const { pendingReservation, alreadyAccepted } = await assignJobToFreelancer(job, req.user);
  try {
    await createNotification({
      recipient: { _id: job.clientId, role: 'client' },
      actor: req.user,
      type: 'job_accepted',
      title: alreadyAccepted ? 'Contract already pending' : 'Online contract created',
      body: `${req.user.fullName || req.user.email} accepted "${job.title}". The online contract is waiting for freelancer signature.`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: { jobId: job._id.toString(), jobTitle: job.title },
    });
    await createNotification({
      recipient: req.user,
      actor: req.user,
      type: 'job_accepted',
      title: 'Signature required',
      body: `You must sign the online contract for "${job.title}" before starting work.`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: { jobId: job._id.toString(), jobTitle: job.title },
    });

    res.status(200).json({
      message: alreadyAccepted ? 'Online contract is already waiting for signature' : 'Online contract created. Please sign before starting work.',
      job: serializeJob(job),
      pendingReservation,
    });
  } catch (error) {
    throw error;
  }
}

export async function signJobOnlineContract(req, res) {
  if (!['client', 'freelancer'].includes(req.user.role)) {
    const error = new Error('Only clients and freelancers can sign online contracts');
    error.statusCode = 403;
    throw error;
  }

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  const isClientOwner = req.user.role === 'client' && String(job.clientId) === String(req.user._id);
  const isAssignedFreelancer = req.user.role === 'freelancer' && String(job.assignedFreelancerId) === String(req.user._id);

  if (job.status !== 'assigned' || (!isClientOwner && !isAssignedFreelancer)) {
    const error = new Error('You can only sign your own assigned contract');
    error.statusCode = 403;
    throw error;
  }

  if (!job.onlineContract) {
    const error = new Error('Online contract has not been created for this job');
    error.statusCode = 409;
    throw error;
  }

  if (job.onlineContract.status === 'signed' && hasBothOnlineContractSignatures(job)) {
    return res.status(200).json({
      message: 'Online contract already signed',
      job: serializeJob(job),
      pendingReservation: await ensurePendingPaymentsForJob(job, { strict: true }),
    });
  }

  const signature = `${req.body?.signature || ''}`.trim();
  if (!signature || signature.length < 2) {
    const error = new Error('Please enter your full name as signature');
    error.statusCode = 400;
    throw error;
  }

  if (isClientOwner && job.onlineContract.clientSignature) {
    return res.status(200).json({
      message: 'Client signature already submitted. Waiting for freelancer signature.',
      job: serializeJob(job),
      pendingReservation: null,
    });
  }

  if (isAssignedFreelancer && job.onlineContract.freelancerSignature) {
    return res.status(200).json({
      message: 'Freelancer signature already submitted. Waiting for client signature.',
      job: serializeJob(job),
      pendingReservation: null,
    });
  }

  const signatureImage = `${req.body?.signatureImage || ''}`.trim();
  if (!signatureImage || !signatureImage.startsWith('data:image/')) {
    const error = new Error('Please upload a valid signature image');
    error.statusCode = 400;
    throw error;
  }
  const now = new Date();

  if (isClientOwner) {
    job.onlineContract.clientSignature = signature;
    job.onlineContract.clientSignatureImage = signatureImage;
    job.onlineContract.clientSignedAt = now;
    job.onlineContract.clientSignedIp = req.ip || '';
  }

  if (isAssignedFreelancer) {
    job.onlineContract.freelancerSignature = signature;
    job.onlineContract.freelancerSignatureImage = signatureImage;
    job.onlineContract.freelancerSignedAt = now;
    job.onlineContract.freelancerSignedIp = req.ip || '';
  }

  const pendingReservation = await finalizeOnlineContractIfReady(job);

  if (!pendingReservation) {
    await job.save();
  }

  const contractReady = job.onlineContract.status === 'signed';
  const recipient = isClientOwner
    ? { _id: job.assignedFreelancerId, role: 'freelancer' }
    : { _id: job.clientId, role: 'client' };
  const signerLabel = req.user.fullName || req.user.companyName || req.user.email;

  await createNotification({
    recipient,
    actor: req.user,
    type: 'contract_signed',
    title: contractReady ? 'Online contract completed' : 'Online contract signature submitted',
    body: contractReady
      ? `${signerLabel} signed the online contract for "${job.title}". Both parties have signed and work can now begin.`
      : `${signerLabel} signed the online contract for "${job.title}". Waiting for the other party signature.`,
    actionPage: 'contracts',
    actionId: job._id.toString(),
    metadata: { jobId: job._id.toString(), jobTitle: job.title },
  });

  res.status(200).json({
    message: contractReady
      ? 'Online contract signed by both parties. Work can now begin.'
      : 'Signature submitted. Waiting for the other party to sign.',
    job: serializeJob(job),
    pendingReservation,
  });
}

function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function downloadJobOnlineContractWord(req, res) {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  const isClientOwner = req.user.role === 'client' && String(job.clientId) === String(req.user._id);
  const isAssignedFreelancer = req.user.role === 'freelancer' && String(job.assignedFreelancerId) === String(req.user._id);
  if (!isClientOwner && !isAssignedFreelancer) {
    const error = new Error('You can only download your own contract');
    error.statusCode = 403;
    throw error;
  }

  if (!job.onlineContract) {
    const error = new Error('Online contract has not been created for this job');
    error.statusCode = 409;
    throw error;
  }

  const content = escapeHtml(job.onlineContract.content || '').replace(/\n/g, '<br/>');
  const clientSignatureImage = job.onlineContract.clientSignatureImage
    ? `<img src="${job.onlineContract.clientSignatureImage}" style="max-width:220px;max-height:100px;border:1px solid #ddd;padding:8px;" />`
    : '<em>Not signed yet</em>';
  const freelancerSignatureImage = job.onlineContract.freelancerSignatureImage
    ? `<img src="${job.onlineContract.freelancerSignatureImage}" style="max-width:220px;max-height:100px;border:1px solid #ddd;padding:8px;" />`
    : '<em>Not signed yet</em>';
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(job.onlineContract.title || job.title)}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
  <h1>${escapeHtml(job.onlineContract.title || job.title)}</h1>
  <div>${content}</div>
  <h2>Signatures</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:50%;vertical-align:top;border:1px solid #ddd;padding:12px;">
        <strong>Client</strong><br/>
        ${escapeHtml(job.onlineContract.clientSignature || job.clientName || 'Client')}<br/><br/>
        ${clientSignatureImage}
      </td>
      <td style="width:50%;vertical-align:top;border:1px solid #ddd;padding:12px;">
        <strong>Freelancer</strong><br/>
        ${escapeHtml(job.onlineContract.freelancerSignature || job.assignedFreelancerName || 'Freelancer')}<br/><br/>
        ${freelancerSignatureImage}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const safeTitle = `${job.title || 'online-contract'}`.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'online-contract';
  res.setHeader('Content-Type', 'application/msword; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.doc"`);
  res.status(200).send(html);
}

export async function submitProposal(req, res) {
  if (req.user.role !== 'freelancer') {
    const error = new Error('Only freelancers can submit proposals');
    error.statusCode = 403;
    throw error;
  }

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.status !== 'open') {
    const error = new Error('This job is no longer accepting proposals');
    error.statusCode = 409;
    throw error;
  }

  if (String(job.clientId) === String(req.user._id)) {
    const error = new Error('You cannot submit a proposal to your own job');
    error.statusCode = 400;
    throw error;
  }

  const bidAmount = parseStrictMoney(req.body?.bidAmount, 'Bid amount');
  const timeline = `${req.body?.timeline || ''}`.trim();
  const coverLetter = `${req.body?.coverLetter || ''}`.trim();

  if (!timeline) {
    const error = new Error('Timeline is required');
    error.statusCode = 400;
    throw error;
  }

  const existingProposal = (job.proposals || []).find((proposal) => String(proposal.freelancerId) === String(req.user._id));

  if (existingProposal) {
    existingProposal.bidAmount = bidAmount;
    existingProposal.timeline = timeline;
    existingProposal.coverLetter = coverLetter;
    existingProposal.status = 'pending';
    existingProposal.submittedAt = new Date();
  } else {
    job.proposals.push({
      freelancerId: req.user._id,
      freelancerName: req.user.fullName || req.user.email,
      freelancerEmail: req.user.email || '',
      bidAmount,
      timeline,
      coverLetter,
      status: 'pending',
      submittedAt: new Date(),
    });
  }

  await job.save();

  await createNotification({
    recipient: { _id: job.clientId, role: 'client' },
    actor: req.user,
    type: 'proposal_submitted',
    title: 'Proposal submitted',
    body: `${req.user.fullName || req.user.email} submitted a proposal for "${job.title}".`,
    actionPage: 'marketplace',
    actionId: job._id.toString(),
    metadata: { jobId: job._id.toString(), jobTitle: job.title },
  });

  res.status(200).json({
    message: existingProposal ? 'Proposal updated successfully' : 'Proposal submitted successfully',
    job: serializeJob(job),
  });
}

export async function selectProposal(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can select a proposal');
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
    const error = new Error('You can only select proposals for your own jobs');
    error.statusCode = 403;
    throw error;
  }

  const proposal = (job.proposals || []).id(req.params.proposalId);
  if (!proposal) {
    const error = new Error('Proposal not found');
    error.statusCode = 404;
    throw error;
  }

  const { account: freelancerAccount } = await findAccountByIdAndRole(proposal.freelancerId, 'freelancer');
  if (!freelancerAccount) {
    const error = new Error('Freelancer account not found');
    error.statusCode = 404;
    throw error;
  }

  applyClientMilestoneSplitToJob(job, proposal, req.body?.milestones);
  const { pendingReservation } = await assignJobToFreelancer(job, freelancerAccount);

  await createNotification({
    recipient: { _id: freelancerAccount._id, role: 'freelancer' },
    actor: req.user,
    type: 'proposal_selected',
    title: 'Proposal selected',
    body: `Your proposal for "${job.title}" was selected. Please sign the online contract before starting work.`,
    actionPage: 'contracts',
    actionId: job._id.toString(),
    metadata: { jobId: job._id.toString(), jobTitle: job.title },
  });

  res.status(200).json({
    message: 'Proposal selected. Online contract is waiting for freelancer signature.',
    job: serializeJob(job),
    pendingReservation,
  });
}

export async function cancelJob(req, res) {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  const isClientOwner = req.user.role === 'client' && String(job.clientId) === String(req.user._id);
  const isAssignedFreelancer = req.user.role === 'freelancer' && String(job.assignedFreelancerId) === String(req.user._id);

  if (!isClientOwner && !isAssignedFreelancer) {
    const error = new Error('You do not have permission to cancel this job');
    error.statusCode = 403;
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

  const counterpart = isClientOwner
    ? { _id: cancelledFreelancerId, role: 'freelancer' }
    : { _id: job.clientId, role: 'client' };
  await createNotification({
    recipient: counterpart,
    actor: req.user,
    type: 'job_cancelled',
    title: 'Contract cancelled',
    body: `"${job.title}" was cancelled and returned to the marketplace.`,
    actionPage: isClientOwner ? 'marketplace' : 'contracts',
    actionId: job._id.toString(),
    metadata: { jobId: job._id.toString(), jobTitle: job.title, refundedAmount },
  });

  res.status(200).json({
    message: 'Job cancelled and returned to marketplace',
    refundedAmount,
    job: serializeJob(job),
  });
}

export async function deleteJob(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can delete job posts');
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
    const error = new Error('You can only delete your own job posts');
    error.statusCode = 403;
    throw error;
  }

  await assertJobHasNoCompletedPayments(job);
  const refundedAmount = await refundPendingPaymentsForJob(job);
  await Job.findByIdAndDelete(job._id);

  res.status(200).json({
    message: 'Job deleted successfully',
    refundedAmount,
    deletedJobId: job._id.toString(),
  });
}

export async function updateJobContractMilestone(req, res) {
  const { jobId, milestoneIndex } = req.params;
  const { submission } = req.body || {};
  const actionAliases = {
    remove: 'remove-submission',
    removeSubmission: 'remove-submission',
    'remove-submission': 'remove-submission',
    deleteSubmission: 'remove-submission',
    'delete-submission': 'remove-submission',
  };
  const actionType = actionAliases[req.body?.actionType] || actionAliases[req.body?.action] || actionAliases[req.body?.type] || req.body?.actionType;

  if (!['submit', 'approve', 'remove-submission'].includes(actionType)) {
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

  if (job.onlineContract?.status !== 'signed' || !hasBothOnlineContractSignatures(job)) {
    const error = new Error('Both client and freelancer must sign the online contract before milestone work can begin');
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

  if (actionType === 'remove-submission') {
    const isAssignedFreelancer = req.user.role === 'freelancer' && String(job.assignedFreelancerId) === String(req.user._id);
    const isClientOwner = req.user.role === 'client' && String(job.clientId) === String(req.user._id);

    if (!isAssignedFreelancer && !isClientOwner) {
      const error = new Error('Only the assigned freelancer or job client can remove submitted files');
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
    target.reviewNote = 'Đã nhận bài nộp và sẵn sàng để khách hàng xem xét.';
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
      nextMilestone.reviewNote = 'Giai đoạn tiếp theo hiện đã sẵn sàng để bàn giao.';
      nextMilestone.submission = nextMilestone.submission || {
        fileName: '',
        fileType: '',
        fileDataUrl: '',
        note: '',
        submittedAt: null,
      };
    }
  }

  if (actionType === 'remove-submission') {
    if (target.status === 'Approved') {
      const error = new Error('Approved milestones cannot remove submitted files');
      error.statusCode = 409;
      throw error;
    }

    if (!target.submission?.fileDataUrl && !target.submission?.fileName) {
      const error = new Error('This milestone does not have an uploaded file to remove');
      error.statusCode = 409;
      throw error;
    }

    target.status = 'In Progress';
    target.action = 'Submit Work';
    target.reviewAction = index === 0 ? 'View Brief' : 'View Draft';
    target.reviewNote = req.user.role === 'client'
      ? 'Khách hàng đã xóa tệp trước đó. Vui lòng tải lại bản bàn giao đã chỉnh sửa.'
      : 'Tệp đã tải lên đã bị xóa. Hãy tải lại bản bàn giao đã chỉnh sửa khi sẵn sàng.';
    target.submission = {
      fileName: '',
      fileType: '',
      fileDataUrl: '',
      note: '',
      submittedAt: null,
    };
  }

  if (actionType === 'approve') {
    await assertNoBlockingDispute(job._id, `${index}`);

    if (!['Completed', 'In Progress'].includes(target.status)) {
      const error = new Error('This milestone is not ready for approval');
      error.statusCode = 409;
      throw error;
    }

    target.status = 'Approved';
    target.action = null;
    target.reviewAction = 'View Product';
    target.reviewNote = 'Đã được khách hàng phê duyệt và ghi nhận trong lịch sử hợp đồng.';

    const nextMilestone = milestones[index + 1];
    if (nextMilestone && nextMilestone.status === 'Pending') {
      nextMilestone.status = 'In Progress';
      nextMilestone.action = 'Submit Work';
      nextMilestone.reviewAction = 'View Draft';
      nextMilestone.reviewNote = 'Milestone này hiện đã sẵn sàng để freelancer bàn giao.';
    }

    const approvedAmount = parseBudgetNumber(target.amount);

    if (approvedAmount > 0) {
      const { account: freelancerAccount, model: freelancerModel } = await findAccountByIdAndRole(job.assignedFreelancerId, 'freelancer');
      let pendingTransaction = await Transaction.findOne({
        type: 'release',
        status: 'pending',
        jobId: job._id,
        milestoneIndex: index,
        fromUser: job.clientId,
        toUser: job.assignedFreelancerId,
      });
      let shouldCreditFreelancer = true;

      if (!pendingTransaction && req.accountModel && req.user?._id) {
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

        pendingTransaction = await Transaction.create({
          type: 'release',
          amount: approvedAmount,
          fromUser: req.user._id,
          toUser: job.assignedFreelancerId,
          jobId: job._id,
          milestoneIndex: index,
          description: `Milestone approved and paid for job: ${job.title}`,
          status: 'completed',
        });
        shouldCreditFreelancer = false;
      }

      if (freelancerAccount && freelancerModel) {
        const nextFreelancerBalance = (freelancerAccount.balance || 0) + approvedAmount;
        await freelancerModel.findByIdAndUpdate(freelancerAccount._id, {
          $set: { balance: nextFreelancerBalance },
        });
      }

      if (pendingTransaction && pendingTransaction.status === 'pending') {
        pendingTransaction.amount = approvedAmount;
        pendingTransaction.status = 'completed';
        pendingTransaction.description = `Milestone approved and paid for job: ${job.title}`;
        await pendingTransaction.save();
      } else if (!pendingTransaction && shouldCreditFreelancer) {
        await Transaction.create({
          type: 'release',
          amount: approvedAmount,
          fromUser: req.user._id,
          toUser: job.assignedFreelancerId,
          jobId: job._id,
          milestoneIndex: index,
          description: `Milestone approved and paid for job: ${job.title}`,
          status: 'completed',
        });
      }
    }
  }

  job.contractState = {
    ...contractState,
    milestones,
    ...computeContractMeta(milestones),
  };
  job.markModified('contractState');
  job.markModified('contractState.milestones');

  await job.save();

  if (actionType === 'submit') {
    await createNotification({
      recipient: req.user,
      actor: req.user,
      type: 'milestone_submitted',
      title: 'Submission sent',
      body: `You submitted "${target.title?.en || `Milestone ${index + 1}`}" for "${job.title}".`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        milestoneIndex: index,
        milestoneTitle: target.title?.en || '',
      },
    });
    await createNotification({
      recipient: { _id: job.clientId, role: 'client' },
      actor: req.user,
      type: 'milestone_submitted',
      title: 'Milestone submitted',
      body: `${req.user.fullName || req.user.email} submitted "${target.title?.en || `Milestone ${index + 1}`}" for "${job.title}".`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        milestoneIndex: index,
        milestoneTitle: target.title?.en || '',
      },
    });
  }

  if (actionType === 'approve') {
    await createNotification({
      recipient: { _id: job.assignedFreelancerId, role: 'freelancer' },
      actor: req.user,
      type: 'milestone_approved',
      title: 'Milestone approved',
      body: `"${target.title?.en || `Milestone ${index + 1}`}" was approved and paid for "${job.title}".`,
      actionPage: 'contracts',
      actionId: job._id.toString(),
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        milestoneIndex: index,
        milestoneTitle: target.title?.en || '',
      },
    });
  }

  res.status(200).json({
    message: actionType === 'submit'
      ? 'Milestone submitted successfully'
      : actionType === 'remove-submission'
        ? 'Submitted file removed successfully'
        : 'Milestone approved successfully',
    job: serializeJob(job),
  });
}

import { formatMoney, normalizeMoneyDisplay, parseMoneyAmount } from './money';

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

function parseTimeline(timeline) {
  if (!timeline) {
    return 'Flexible';
  }

  return timeline;
}

function parseBudgetNumber(budget) {
  return parseMoneyAmount(budget);
}

function formatCurrency(amount) {
  return formatMoney(amount);
}

function buildDefaultMilestones(job) {
  const totalBudget = parseBudgetNumber(job.budget);
  const kickoffAmount = totalBudget > 0 ? Math.round(totalBudget * 0.4) : 0;
  const finalAmount = totalBudget > 0 ? totalBudget - kickoffAmount : 0;

  return [
    {
      title: {
        en: 'Kickoff and scope alignment',
        vi: 'Khởi động và thống nhất phạm vi',
      },
      dueDate: formatDisplayDate(job.acceptedAt || job.createdAt),
      amount: kickoffAmount > 0 ? formatCurrency(kickoffAmount) : job.budget,
      status: 'In Progress',
      action: 'Submit Work',
      reviewAction: 'View Brief',
      reviewNote: job.scopeSummary || 'Bắt đầu bằng việc thống nhất phạm vi, sản phẩm bàn giao và mốc phê duyệt đầu tiên.',
    },
    {
      title: {
        en: 'Final delivery and approval',
        vi: 'Bàn giao cuối cùng và phê duyệt',
      },
      dueDate: parseTimeline(job.timeline),
      amount: finalAmount > 0 ? formatCurrency(finalAmount) : job.budget,
      status: 'Pending',
      action: null,
      reviewAction: null,
      reviewNote: 'Milestone này sẽ được mở khi giai đoạn khởi động đã được phê duyệt.',
    },
  ];
}

function normalizeLocalizedText(value, fallback) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return {
      en: trimmed || fallback,
      vi: trimmed || fallback,
    };
  }

  if (value && typeof value === 'object') {
    const en = `${value.en || value.vi || fallback}`.trim() || fallback;
    const vi = `${value.vi || value.en || fallback}`.trim() || fallback;

    return { en, vi };
  }

  return {
    en: fallback,
    vi: fallback,
  };
}

function normalizeSubmission(submission) {
  if (!submission || typeof submission !== 'object') {
    return null;
  }

  return {
    fileName: `${submission.fileName || ''}`.trim(),
    fileType: `${submission.fileType || ''}`.trim(),
    fileDataUrl: `${submission.fileDataUrl || ''}`.trim(),
    note: `${submission.note || ''}`.trim(),
    submittedAt: submission.submittedAt || null,
  };
}

function normalizeMilestone(milestone, index) {
  const title = normalizeLocalizedText(milestone?.title, `Milestone ${index + 1}`);
  const status = `${milestone?.status || 'Pending'}`.trim() || 'Pending';

  return {
    ...milestone,
    title,
    dueDate: `${milestone?.dueDate || 'Flexible'}`.trim() || 'Flexible',
    amount: normalizeMoneyDisplay(milestone?.amount || 0),
    status,
    action: milestone?.action || null,
    reviewAction: milestone?.reviewAction || null,
    reviewNote: `${milestone?.reviewNote || ''}`.trim(),
    submission: normalizeSubmission(milestone?.submission),
  };
}

export function normalizeContractForView(contract, fallbackIndex = 0) {
  const milestones = Array.isArray(contract?.milestones)
    ? contract.milestones.map((milestone, index) => normalizeMilestone(milestone, index))
    : [];

  const completedMilestones = milestones.filter((milestone) => milestone.status === 'Approved').length;
  const totalMilestones = Number.isFinite(contract?.totalMilestones)
    ? contract.totalMilestones
    : milestones.length;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const status = `${contract?.status || (milestones.every((milestone) => milestone.status === 'Approved') ? 'Completed' : 'Active')}`.trim() || 'Active';

  return {
    ...contract,
    id: `${contract?.id ?? `contract-${fallbackIndex + 1}`}`,
    title: normalizeLocalizedText(contract?.title, 'Untitled contract'),
    client: `${contract?.client || contract?.clientName || contract?.assignedFreelancerName || 'Unknown client'}`.trim() || 'Unknown client',
    budget: normalizeMoneyDisplay(contract?.budget || 0),
    earned: normalizeMoneyDisplay(contract?.earned || 0),
    startDate: `${contract?.startDate || 'Open'}`.trim() || 'Open',
    endDate: `${contract?.endDate || 'Flexible'}`.trim() || 'Flexible',
    progress,
    completedMilestones,
    totalMilestones,
    status,
    milestones,
  };
}

export function sortContractsByWorkState(contracts) {
  return [...contracts].sort((first, second) => {
    const firstCompleted = first?.status === 'Completed';
    const secondCompleted = second?.status === 'Completed';

    if (firstCompleted === secondCompleted) {
      return 0;
    }

    return firstCompleted ? 1 : -1;
  });
}

export function createContractFromAcceptedJob(job) {
  const contractState = job.contractState || {};
  const milestones = Array.isArray(contractState.milestones) && contractState.milestones.length > 0
    ? contractState.milestones
    : buildDefaultMilestones(job);
  const freelancerProposalStatus = job.freelancerProposalStatus || 'pending';
  const derivedStatus = freelancerProposalStatus === 'declined'
    ? 'Declined'
    : (contractState.status || 'Active');

  return normalizeContractForView({
    id: `job-contract-${job.id}`,
    sourceJobId: job.id,
    clientId: job.clientId || null,
    assignedFreelancerId: job.assignedFreelancerId || null,
    assignedFreelancerName: job.assignedFreelancerName || '',
    initials: (job.client || 'CL')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CL',
    title: {
      en: job.title,
      vi: job.title,
    },
    client: job.client,
    budget: job.budget,
    earned: contractState.earned || formatCurrency(0),
    startDate: formatDisplayDate(job.acceptedAt || job.createdAt),
    endDate: parseTimeline(job.timeline),
    progress: contractState.progress ?? 0,
    completedMilestones: contractState.completedMilestones ?? 0,
    totalMilestones: contractState.totalMilestones ?? milestones.length,
    status: derivedStatus,
    onlineContract: job.onlineContract || null,
    source: 'job-acceptance',
    milestones,
    freelancerProposalStatus,
  });
}

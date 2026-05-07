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

function buildDefaultMilestones(job) {
  const totalBudget = parseBudgetNumber(job.budget);
  const kickoffAmount = totalBudget > 0 ? Math.round(totalBudget * 0.4) : 0;
  const finalAmount = totalBudget > 0 ? totalBudget - kickoffAmount : 0;

  return [
    {
      title: {
        en: 'Kickoff and scope alignment',
        vi: 'Kickoff and scope alignment',
      },
      dueDate: formatDisplayDate(job.acceptedAt || job.createdAt),
      amount: kickoffAmount > 0 ? formatCurrency(kickoffAmount) : job.budget,
      status: 'In Progress',
      action: 'Submit Work',
      reviewAction: 'View Brief',
      reviewNote: job.scopeSummary || 'Start by aligning on scope, deliverables, and the first approval checkpoint.',
    },
    {
      title: {
        en: 'Final delivery and approval',
        vi: 'Final delivery and approval',
      },
      dueDate: parseTimeline(job.timeline),
      amount: finalAmount > 0 ? formatCurrency(finalAmount) : job.budget,
      status: 'Pending',
      action: null,
      reviewAction: null,
      reviewNote: 'This milestone will move forward once the kickoff phase is approved.',
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
    amount: `${milestone?.amount || '$0'}`.trim() || '$0',
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

  const completedMilestones = Number.isFinite(contract?.completedMilestones)
    ? contract.completedMilestones
    : milestones.filter((milestone) => ['Approved', 'Completed'].includes(milestone.status)).length;
  const totalMilestones = Number.isFinite(contract?.totalMilestones)
    ? contract.totalMilestones
    : milestones.length;
  const progress = Number.isFinite(contract?.progress)
    ? contract.progress
    : (totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0);
  const status = `${contract?.status || (milestones.every((milestone) => milestone.status === 'Approved') ? 'Completed' : 'Active')}`.trim() || 'Active';

  return {
    ...contract,
    id: `${contract?.id ?? `contract-${fallbackIndex + 1}`}`,
    title: normalizeLocalizedText(contract?.title, 'Untitled contract'),
    client: `${contract?.client || contract?.clientName || contract?.assignedFreelancerName || 'Unknown client'}`.trim() || 'Unknown client',
    budget: `${contract?.budget || '$0'}`.trim() || '$0',
    earned: `${contract?.earned || '$0'}`.trim() || '$0',
    startDate: `${contract?.startDate || 'Open'}`.trim() || 'Open',
    endDate: `${contract?.endDate || 'Flexible'}`.trim() || 'Flexible',
    progress,
    completedMilestones,
    totalMilestones,
    status,
    milestones,
  };
}

export function createContractFromAcceptedJob(job) {
  const contractState = job.contractState || {};
  const milestones = Array.isArray(contractState.milestones) && contractState.milestones.length > 0
    ? contractState.milestones
    : buildDefaultMilestones(job);

  return normalizeContractForView({
    id: `job-contract-${job.id}`,
    sourceJobId: job.id,
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
    earned: contractState.earned || '$0',
    startDate: formatDisplayDate(job.acceptedAt || job.createdAt),
    endDate: parseTimeline(job.timeline),
    progress: contractState.progress ?? 0,
    completedMilestones: contractState.completedMilestones ?? 0,
    totalMilestones: contractState.totalMilestones ?? milestones.length,
    status: contractState.status || 'Active',
    source: 'job-acceptance',
    milestones,
  });
}

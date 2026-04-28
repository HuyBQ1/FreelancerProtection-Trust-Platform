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

export function createContractFromAcceptedJob(job) {
  return {
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
    earned: '$0',
    startDate: formatDisplayDate(job.acceptedAt || job.createdAt),
    endDate: parseTimeline(job.timeline),
    progress: 0,
    completedMilestones: 0,
    totalMilestones: 2,
    status: 'Active',
    source: 'job-acceptance',
    milestones: [
      {
        title: {
          en: 'Kickoff and scope alignment',
          vi: 'Kickoff and scope alignment',
        },
        dueDate: formatDisplayDate(job.acceptedAt || job.createdAt),
        amount: job.budget,
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
        amount: job.budget,
        status: 'Pending',
        action: null,
        reviewAction: null,
        reviewNote: 'This milestone will move forward once the kickoff phase is approved.',
      },
    ],
  };
}

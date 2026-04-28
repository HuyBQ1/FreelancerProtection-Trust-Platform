import Job from '../models/Job.js';

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
    client: job.clientName,
    status: job.status,
    assignedFreelancerId: job.assignedFreelancerId?.toString?.() || '',
    assignedFreelancerName: job.assignedFreelancerName || '',
    assignedFreelancerRole: job.assignedFreelancerRole || '',
    acceptedAt: job.acceptedAt,
    createdAt: job.createdAt,
  };
}

export async function createJob(req, res) {
  if (req.user.role !== 'client') {
    const error = new Error('Only clients can create jobs');
    error.statusCode = 403;
    throw error;
  }

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
  } = req.body || {};

  if (!title?.trim() || !description?.trim() || !category?.trim() || !budget?.trim()) {
    const error = new Error('Title, description, category, and budget are required');
    error.statusCode = 400;
    throw error;
  }

  const job = await Job.create({
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
    clientId: req.user._id,
    clientName: req.user.companyName || req.user.fullName || req.user.email,
  });

  res.status(201).json({
    message: 'Job created successfully',
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
    status: 'assigned',
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

  await job.save();

  res.status(200).json({
    message: 'Job accepted successfully',
    job: serializeJob(job),
  });
}

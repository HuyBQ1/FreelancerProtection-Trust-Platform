import mongoose from 'mongoose';

const contractMilestoneSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, default: '' },
      vi: { type: String, default: '' },
    },
    dueDate: { type: String, default: '' },
    amount: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Approved'],
      default: 'Pending',
    },
    action: { type: String, default: null },
    reviewAction: { type: String, default: null },
    reviewNote: { type: String, default: '' },
    submission: {
      fileName: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileDataUrl: { type: String, default: '' },
      note: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
  },
  { _id: false },
);

const jobMilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false },
);

const contractStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active',
    },
    progress: { type: Number, default: 0 },
    completedMilestones: { type: Number, default: 0 },
    totalMilestones: { type: Number, default: 0 },
    earned: { type: String, default: '$0' },
    milestones: {
      type: [contractMilestoneSchema],
      default: [],
    },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      default: '',
      trim: true,
    },
    timeline: {
      type: String,
      default: '',
      trim: true,
    },
    locationType: {
      type: String,
      default: '',
      trim: true,
    },
    engagementType: {
      type: String,
      default: '',
      trim: true,
    },
    scopeSummary: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    milestones: {
      type: [jobMilestoneSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'closed'],
      default: 'open',
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'rejected'],
      default: 'approved',
    },
    moderationReason: {
      type: String,
      default: '',
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    assignedFreelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    assignedFreelancerName: {
      type: String,
      default: '',
      trim: true,
    },
    assignedFreelancerRole: {
      type: String,
      enum: ['', 'freelancer'],
      default: '',
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    contractState: {
      type: contractStateSchema,
      default: null,
    },
  },
  { timestamps: true },
);

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export default Job;

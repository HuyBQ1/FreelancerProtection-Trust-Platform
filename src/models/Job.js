import mongoose from 'mongoose';

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
    status: {
      type: String,
      enum: ['open', 'assigned', 'closed'],
      default: 'open',
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
  },
  { timestamps: true },
);

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export default Job;

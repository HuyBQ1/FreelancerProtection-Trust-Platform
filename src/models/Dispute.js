import mongoose from 'mongoose';

export const DISPUTE_CATEGORIES = [
  'PAYMENT_NOT_RELEASED',
  'POOR_DELIVERABLE_QUALITY',
  'MISSED_DEADLINE',
  'CONTRACT_VIOLATION',
  'FRAUD_SUSPICIOUS_BEHAVIOR',
];

export const DISPUTE_STATUSES = [
  'OPEN',
  'WAITING_RESPONSE',
  'UNDER_REVIEW',
  'RESOLVED',
  'CLOSED',
];

const disputeSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contractModel: {
      type: String,
      enum: ['Job', 'Contract'],
      default: 'Job',
    },
    milestoneId: {
      type: String,
      default: '',
      trim: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    raisedByRole: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
    raisedByName: {
      type: String,
      default: '',
      trim: true,
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    againstUserRole: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
    againstUserName: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: DISPUTE_CATEGORIES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: DISPUTE_STATUSES,
      default: 'OPEN',
      index: true,
    },
    resolution: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    adminAction: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);

export default Dispute;

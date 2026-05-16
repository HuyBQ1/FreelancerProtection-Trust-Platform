import mongoose from 'mongoose';

export const EVIDENCE_TYPES = ['IMAGE', 'PDF', 'DELIVERABLE', 'GITHUB_LINK', 'CHAT_HISTORY'];

const disputeEvidenceSchema = new mongoose.Schema(
  {
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
    uploadedByName: {
      type: String,
      default: '',
      trim: true,
    },
    evidenceType: {
      type: String,
      enum: EVIDENCE_TYPES,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12000000,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255,
    },
    fileType: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const DisputeEvidence = mongoose.models.DisputeEvidence || mongoose.model('DisputeEvidence', disputeEvidenceSchema);

export default DisputeEvidence;

import mongoose from 'mongoose';

const disputeResponseSchema = new mongoose.Schema(
  {
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const DisputeResponse = mongoose.models.DisputeResponse || mongoose.model('DisputeResponse', disputeResponseSchema);

export default DisputeResponse;

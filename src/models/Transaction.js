import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'release', 'withdrawal', 'refund', 'platform_fee'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    milestoneIndex: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    paymentProvider: {
      type: String,
      default: '',
      trim: true,
    },
    paymentCode: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    providerTransactionId: {
      type: String,
      default: '',
      trim: true,
    },
    toUserRole: {
      type: String,
      enum: ['', 'client', 'freelancer', 'admin'],
      default: '',
    },
    paymentMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

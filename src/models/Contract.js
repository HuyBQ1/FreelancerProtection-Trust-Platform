import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    vi: { type: String, required: true },
  },
  dueDate: { type: String },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Approved'],
    default: 'Pending',
  },
  action: { type: String, default: null },
  reviewAction: { type: String, default: null },
  reviewNote: { type: String, default: '' },
  isFunded: { type: Boolean, default: false },
});

const contractSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      vi: { type: String, required: true },
    },
    clientName: { type: String, required: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    budget: { type: Number, required: true },
    earned: { type: Number, default: 0 },
    startDate: { type: String },
    endDate: { type: String },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    milestones: [milestoneSchema],
  },
  { timestamps: true }
);

const Contract = mongoose.model('Contract', contractSchema);

export default Contract;

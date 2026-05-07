import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

const dealSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['none', 'proposed', 'accepted'],
      default: 'none',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    milestoneIndex: {
      type: Number,
      default: null,
    },
    milestoneTitle: {
      type: String,
      trim: true,
      default: '',
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updatedByRole: {
      type: String,
      enum: ['', 'client', 'freelancer', 'admin'],
      default: '',
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const chatThreadSchema = new mongoose.Schema(
  {
    contract: {
      type: String,
      trim: true,
      default: 'General discussion',
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: 'A chat thread requires at least two participants.',
      },
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    deal: {
      type: dealSchema,
      default: () => ({ status: 'none' }),
    },
  },
  {
    timestamps: true,
  },
);

const ChatThread = mongoose.models.ChatThread || mongoose.model('ChatThread', chatThreadSchema);

export default ChatThread;

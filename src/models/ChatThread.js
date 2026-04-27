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

const chatThreadSchema = new mongoose.Schema(
  {
    contract: {
      type: String,
      trim: true,
      default: 'General discussion',
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
  },
  {
    timestamps: true,
  },
);

const ChatThread = mongoose.models.ChatThread || mongoose.model('ChatThread', chatThreadSchema);

export default ChatThread;

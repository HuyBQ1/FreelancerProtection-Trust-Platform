import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    milestoneId: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  },
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;

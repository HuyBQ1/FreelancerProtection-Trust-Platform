import mongoose from 'mongoose';

const registrationOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    registrationPayload: {
      type: Object,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

const RegistrationOtp = mongoose.models.RegistrationOtp || mongoose.model('RegistrationOtp', registrationOtpSchema);

export default RegistrationOtp;

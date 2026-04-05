import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
      default: 'freelancer',
    },
    avatar: {
      type: String,
      default: '',
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    settings: {
      language: {
        type: String,
        enum: ['en', 'vi'],
        default: 'vi',
      },
      notifications: {
        contractAlerts: {
          type: Boolean,
          default: true,
        },
        payoutAlerts: {
          type: Boolean,
          default: true,
        },
        weeklySummary: {
          type: Boolean,
          default: false,
        },
      },
      clientProfile: {
        companyName: {
          type: String,
          trim: true,
          default: '',
        },
        companyWebsite: {
          type: String,
          trim: true,
          default: '',
        },
        billingEmail: {
          type: String,
          trim: true,
          default: '',
        },
      },
      freelancerProfile: {
        headline: {
          type: String,
          trim: true,
          default: '',
        },
        skills: {
          type: [String],
          default: [],
        },
        portfolioUrl: {
          type: String,
          trim: true,
          default: '',
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

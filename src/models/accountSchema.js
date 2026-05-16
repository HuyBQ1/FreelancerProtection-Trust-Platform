import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export function createAccountSchema({ allowedRoles, defaultRole }) {
  const accountSchema = new mongoose.Schema(
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
        enum: allowedRoles,
        required: true,
        default: defaultRole,
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
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      escrowBalance: {
        type: Number,
        default: 0,
        min: 0,
      },
      isBanned: {
        type: Boolean,
        default: false,
      },
      warnings: {
        type: Number,
        default: 0,
        min: 0,
      },
      moderation: {
        status: {
          type: String,
          enum: ['Healthy', 'Review', 'Monitor', 'Escalated', 'Banned'],
          default: 'Healthy',
        },
        risk: {
          type: String,
          enum: ['Low', 'Medium', 'High'],
          default: 'Low',
        },
        reason: {
          type: String,
          trim: true,
          default: '',
        },
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
          cvFileName: {
            type: String,
            trim: true,
            default: '',
          },
          cvFileType: {
            type: String,
            trim: true,
            default: '',
          },
          cvDataUrl: {
            type: String,
            default: '',
          },
        },
        bankAccount: {
          bankName: {
            type: String,
            trim: true,
            default: '',
          },
          accountName: {
            type: String,
            trim: true,
            default: '',
          },
          accountNumber: {
            type: String,
            trim: true,
            default: '',
          },
          swiftCode: {
            type: String,
            trim: true,
            default: '',
          },
          isFrozen: {
            type: Boolean,
            default: false,
          },
          frozenReason: {
            type: String,
            trim: true,
            default: '',
          },
          frozenAt: {
            type: Date,
            default: null,
          },
        },
      },
    },
    {
      timestamps: true,
    },
  );

  accountSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) {
      next();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  accountSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  return accountSchema;
}

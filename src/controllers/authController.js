import crypto from 'crypto';
import RegistrationOtp from '../models/RegistrationOtp.js';
import { ensureEmailIsAvailable } from '../services/accountService.js';
import { loginUser, registerUser } from '../services/authService.js';
import { sendRegistrationOtpEmail } from '../services/emailService.js';

function serializeAuthResponse({ user, token }) {
  return {
    message: 'Success',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName || '',
      avatar: user.avatar || '',
      companyName: user.companyName || '',
      headline: user.headline || '',
      settings: user.settings || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function register(req, res) {
  if (process.env.ALLOW_DIRECT_REGISTER !== 'true') {
    const error = new Error('Please verify email OTP before registration');
    error.statusCode = 403;
    throw error;
  }

  const { email, password, role, fullName, companyName, headline } = req.body;

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  if (role && !['client', 'freelancer', 'admin'].includes(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const payload = await registerUser({
    email,
    password,
    role: role || 'freelancer',
    fullName,
    companyName,
    headline,
  });

  res.status(201).json(serializeAuthResponse(payload));
}

function normalizeEmail(email) {
  return `${email || ''}`.trim().toLowerCase();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(`${otp}`).digest('hex');
}

function generateOtp() {
  return `${crypto.randomInt(100000, 1000000)}`;
}

function validateRegistrationPayload({ email, password, role }) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  if (password.trim().length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    throw error;
  }

  if (role && !['client', 'freelancer'].includes(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }
}

export async function requestRegistrationOtp(req, res) {
  const { email, password, role, fullName, companyName, headline } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  validateRegistrationPayload({ email: normalizedEmail, password, role });
  await ensureEmailIsAvailable(normalizedEmail);

  const otp = generateOtp();
  const registrationPayload = {
    email: normalizedEmail,
    password,
    role: role || 'freelancer',
    fullName,
    companyName,
    headline,
  };

  await RegistrationOtp.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        otpHash: hashOtp(otp),
        registrationPayload,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    },
    { upsert: true, new: true },
  );

  const delivery = await sendRegistrationOtpEmail({ email: normalizedEmail, otp });

  res.status(200).json({
    message: delivery.devMode
      ? 'OTP generated. Configure SMTP to send it by email.'
      : 'OTP sent to email',
    devMode: delivery.devMode,
  });
}

export async function verifyRegistrationOtp(req, res) {
  const email = normalizeEmail(req.body?.email);
  const otp = `${req.body?.otp || ''}`.trim();

  if (!email || !otp) {
    const error = new Error('Email and OTP are required');
    error.statusCode = 400;
    throw error;
  }

  const record = await RegistrationOtp.findOne({ email });

  if (!record || record.expiresAt < new Date()) {
    const error = new Error('OTP has expired or does not exist');
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts >= 5) {
    const error = new Error('Too many OTP attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  if (record.otpHash !== hashOtp(otp)) {
    record.attempts += 1;
    await record.save();
    const error = new Error('Invalid OTP');
    error.statusCode = 400;
    throw error;
  }

  await ensureEmailIsAvailable(email);

  const payload = await registerUser(record.registrationPayload);
  await RegistrationOtp.deleteOne({ _id: record._id });

  res.status(201).json(serializeAuthResponse(payload));
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const payload = await loginUser({ email, password });

  res.status(200).json(serializeAuthResponse(payload));
}

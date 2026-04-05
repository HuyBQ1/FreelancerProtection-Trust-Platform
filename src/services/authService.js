import User from '../models/User.js';
import { generateToken } from './tokenService.js';

export async function registerUser({ email, password, role, fullName, companyName, headline }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    email,
    password,
    role,
    fullName: fullName?.trim() || '',
    companyName: companyName?.trim() || '',
    headline: headline?.trim() || '',
    settings: {
      clientProfile: {
        companyName: companyName?.trim() || '',
      },
      freelancerProfile: {
        headline: headline?.trim() || '',
      },
    },
  });

  return {
    user,
    token: generateToken(user._id),
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return {
    user,
    token: generateToken(user._id),
  };
}

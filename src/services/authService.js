<<<<<<< HEAD
import { ensureEmailIsAvailable, findAccountByEmail, getPrimaryModelByRole } from './accountService.js';
import { generateToken } from './tokenService.js';

export async function registerUser({ email, password, role, fullName, companyName, headline }) {
  await ensureEmailIsAvailable(email);

  const AccountModel = getPrimaryModelByRole(role);

  const user = await AccountModel.create({
=======
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
>>>>>>> origin/review
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
<<<<<<< HEAD
    token: generateToken(user._id, user.role),
=======
    token: generateToken(user._id),
>>>>>>> origin/review
  };
}

export async function loginUser({ email, password }) {
<<<<<<< HEAD
  const user = await findAccountByEmail(email);
=======
  const user = await User.findOne({ email: email.toLowerCase() });
>>>>>>> origin/review

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
<<<<<<< HEAD
    token: generateToken(user._id, user.role),
=======
    token: generateToken(user._id),
>>>>>>> origin/review
  };
}

import { ensureEmailIsAvailable, findAccountByEmail, getPrimaryModelByRole } from './accountService.js';
import { generateToken } from './tokenService.js';

export async function registerUser({ email, password, role, fullName, companyName, headline }) {
  await ensureEmailIsAvailable(email);

  const AccountModel = getPrimaryModelByRole(role);

  const user = await AccountModel.create({
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
    token: generateToken(user._id, user.role),
  };
}

export async function loginUser({ email, password }) {
  const user = await findAccountByEmail(email);

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
    token: generateToken(user._id, user.role),
  };
}

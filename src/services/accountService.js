import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';
import User from '../models/User.js';

const primaryModelsByRole = {
  client: Client,
  freelancer: Freelancer,
  admin: User,
};

export function getPrimaryModelByRole(role) {
  return primaryModelsByRole[role] || User;
}

export function getCandidateModelsForRole(role) {
  if (role === 'client') {
    return [Client, User];
  }

  if (role === 'freelancer') {
    return [Freelancer, User];
  }

  return [User];
}

export async function findAccountByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const models = [Client, Freelancer, User];

  for (const model of models) {
    const account = await model.findOne({ email: normalizedEmail });
    if (account) {
      return account;
    }
  }

  return null;
}

export async function findAccountByIdAndRole(id, role) {
  const candidates = getCandidateModelsForRole(role);

  for (const model of candidates) {
    const account = model === User
      ? await model.findOne({ _id: id, role }).select('-password')
      : await model.findById(id).select('-password');

    if (account) {
      return { account, model };
    }
  }

  return { account: null, model: null };
}

export async function ensureEmailIsAvailable(email, excludeAccount) {
  const existingAccount = await findAccountByEmail(email);

  if (!existingAccount) {
    return;
  }

  if (
    excludeAccount
    && String(existingAccount._id) === String(excludeAccount._id)
    && existingAccount.role === excludeAccount.role
  ) {
    return;
  }

  const error = new Error('Email is already in use');
  error.statusCode = 409;
  throw error;
}

export async function findFirstAccountByRole(role, excludeAccount) {
  const candidates = getCandidateModelsForRole(role);

  for (const model of candidates) {
    const query = model === User
      ? { role }
      : {};

    if (excludeAccount) {
      query._id = { $ne: excludeAccount._id };
    }

    const account = await model.findOne(query).sort({ createdAt: 1 });
    if (account) {
      return account;
    }
  }

  return null;
}

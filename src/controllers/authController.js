import { loginUser, registerUser } from '../services/authService.js';

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

import jwt from 'jsonwebtoken';
import env from '../config/env.js';
<<<<<<< HEAD
import { findAccountByIdAndRole } from '../services/accountService.js';
=======
import User from '../models/User.js';
>>>>>>> origin/review

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      const error = new Error('Authorization token is missing');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
<<<<<<< HEAD
    const { account, model } = await findAccountByIdAndRole(decoded.userId, decoded.role);

    if (!account) {
=======
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
>>>>>>> origin/review
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

<<<<<<< HEAD
    req.user = account;
    req.accountModel = model;
=======
    req.user = user;
>>>>>>> origin/review
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}

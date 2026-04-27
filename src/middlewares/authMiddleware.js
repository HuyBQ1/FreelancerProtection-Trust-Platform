import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findAccountByIdAndRole } from '../services/accountService.js';

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
    const { account, model } = await findAccountByIdAndRole(decoded.userId, decoded.role);

    if (!account) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    req.user = account;
    req.accountModel = model;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}

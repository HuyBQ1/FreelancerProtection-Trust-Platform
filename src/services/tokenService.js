import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

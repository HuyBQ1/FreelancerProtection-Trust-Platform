import jwt from 'jsonwebtoken';
import env from '../config/env.js';

<<<<<<< HEAD
export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, env.jwtSecret, {
=======
export function generateToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, {
>>>>>>> origin/review
    expiresIn: env.jwtExpiresIn,
  });
}

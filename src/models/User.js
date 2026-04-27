import mongoose from 'mongoose';
import { createAccountSchema } from './accountSchema.js';

const userSchema = createAccountSchema({
  allowedRoles: ['admin', 'client', 'freelancer'],
  defaultRole: 'admin',
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

import mongoose from 'mongoose';
import { createAccountSchema } from './accountSchema.js';

const freelancerSchema = createAccountSchema({
  allowedRoles: ['freelancer'],
  defaultRole: 'freelancer',
});

const Freelancer = mongoose.models.Freelancer || mongoose.model('Freelancer', freelancerSchema);

export default Freelancer;

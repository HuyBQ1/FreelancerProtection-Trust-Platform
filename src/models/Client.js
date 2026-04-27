import mongoose from 'mongoose';
import { createAccountSchema } from './accountSchema.js';

const clientSchema = createAccountSchema({
  allowedRoles: ['client'],
  defaultRole: 'client',
});

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export default Client;

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import chatRoutes from './chatRoutes.js';
import jobRoutes from './jobRoutes.js';
import userRoutes from './userRoutes.js';
import escrowRoutes from './escrowRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/escrow', escrowRoutes);

export default router;

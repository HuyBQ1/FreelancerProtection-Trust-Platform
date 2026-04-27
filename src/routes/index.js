import { Router } from 'express';
import authRoutes from './authRoutes.js';
import chatRoutes from './chatRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);

export default router;

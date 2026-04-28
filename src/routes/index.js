import { Router } from 'express';
import authRoutes from './authRoutes.js';
<<<<<<< HEAD
import chatRoutes from './chatRoutes.js';
import userRoutes from './userRoutes.js';
import escrowRoutes from './escrowRoutes.js';
=======
import userRoutes from './userRoutes.js';
import reviewRoutes from './reviewRoutes.js';
>>>>>>> origin/review

const router = Router();

router.use('/auth', authRoutes);
<<<<<<< HEAD
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/escrow', escrowRoutes);
=======
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
>>>>>>> origin/review

export default router;

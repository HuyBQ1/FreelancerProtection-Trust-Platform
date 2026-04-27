import { Router } from 'express';
import {
  createThread,
  getThreads,
  markThreadRead,
  sendMessage,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/threads', protect, asyncHandler(getThreads));
router.post('/threads', protect, asyncHandler(createThread));
router.put('/threads/:threadId/read', protect, asyncHandler(markThreadRead));
router.post('/threads/:threadId/messages', protect, asyncHandler(sendMessage));

export default router;

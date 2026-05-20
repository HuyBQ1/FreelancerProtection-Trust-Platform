import { Router } from 'express';
import {
  createThread,
  deleteThread,
  getThreads,
  markThreadRead,
  sendMessage,
  updateDeal,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/threads', protect, asyncHandler(getThreads));
router.post('/threads', protect, asyncHandler(createThread));
router.delete('/threads/:threadId', protect, asyncHandler(deleteThread));
router.put('/threads/:threadId/read', protect, asyncHandler(markThreadRead));
router.post('/threads/:threadId/messages', protect, asyncHandler(sendMessage));
router.patch('/threads/:threadId/deal', protect, asyncHandler(updateDeal));
router.put('/threads/:threadId/deal', protect, asyncHandler(updateDeal));
router.post('/threads/:threadId/deal', protect, asyncHandler(updateDeal));

export default router;

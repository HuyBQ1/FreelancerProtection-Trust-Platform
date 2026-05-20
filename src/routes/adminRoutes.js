import { Router } from 'express';
import {
  cancelAdminContract,
  deleteAdminReview,
  getAdminOverview,
  updateAdminReviewStatus,
  updateJobModeration,
  updateTransactionStatus,
  updateUserModeration,
} from '../controllers/adminController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/overview', asyncHandler(getAdminOverview));
router.patch('/users/:role/:userId/moderation', asyncHandler(updateUserModeration));
router.patch('/jobs/:jobId/moderation', asyncHandler(updateJobModeration));
router.patch('/jobs/:jobId/cancel', asyncHandler(cancelAdminContract));
router.post('/jobs/:jobId/cancel', asyncHandler(cancelAdminContract));
router.patch('/transactions/:transactionId/status', asyncHandler(updateTransactionStatus));
router.patch('/reviews/:reviewId/status', asyncHandler(updateAdminReviewStatus));
router.delete('/reviews/:reviewId', asyncHandler(deleteAdminReview));

export default router;

import { Router } from 'express';
import {
  getAdminOverview,
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
router.patch('/transactions/:transactionId/status', asyncHandler(updateTransactionStatus));

export default router;

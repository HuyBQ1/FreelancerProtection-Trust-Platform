import { Router } from 'express';
import {
  getProfile,
  updateAvatar,
  updateProfile,
  updateUserSettings,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/profile', protect, asyncHandler(getProfile));
router.put('/profile', protect, asyncHandler(updateProfile));
router.put('/avatar', protect, asyncHandler(updateAvatar));
router.put('/settings', protect, asyncHandler(updateUserSettings));

export default router;

import { Router } from 'express';
import {
  getCv,
  getPublicProfile,
  getProfile,
  updateCv,
  updateAvatar,
  updateProfile,
  updateUserSettings,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/profile', protect, asyncHandler(getProfile));
router.get('/public/:role/:userId', protect, asyncHandler(getPublicProfile));
router.get('/cv/:role/:userId', protect, asyncHandler(getCv));
router.put('/profile', protect, asyncHandler(updateProfile));
router.put('/avatar', protect, asyncHandler(updateAvatar));
router.put('/cv', protect, asyncHandler(updateCv));
router.put('/settings', protect, asyncHandler(updateUserSettings));

export default router;

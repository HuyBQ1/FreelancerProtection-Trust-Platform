import { Router } from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', protect, asyncHandler(getNotifications));
router.patch('/read-all', protect, asyncHandler(markAllNotificationsRead));
router.patch('/:notificationId/read', protect, asyncHandler(markNotificationRead));

export default router;

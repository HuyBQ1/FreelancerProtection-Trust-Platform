import { Router } from 'express';
import {
    approveReview,
    createReview,
    deleteReview,
    getMilestoneReviews,
    getPendingReviews,
    getUserAverageRating,
    getUserReviews,
    rejectReview,
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();


router.post('/create', protect, asyncHandler(createReview));


router.get('/user/:userId', asyncHandler(getUserReviews));


router.get('/milestone/:contractId/:milestoneId', asyncHandler(getMilestoneReviews));


router.get('/rating/:userId', asyncHandler(getUserAverageRating));


router.get('/pending/all', protect, asyncHandler(getPendingReviews));


router.patch('/approve/:reviewId', protect, asyncHandler(approveReview));

router.patch('/reject/:reviewId', protect, asyncHandler(rejectReview));


router.delete('/delete/:reviewId', protect, asyncHandler(deleteReview));

export default router;
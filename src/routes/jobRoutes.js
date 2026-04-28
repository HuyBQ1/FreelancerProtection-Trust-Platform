import { Router } from 'express';
import { acceptJob, createJob, getAssignedJobs, getMyJobs, getPublicJobs } from '../controllers/jobController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(getPublicJobs));
router.get('/assigned', protect, asyncHandler(getAssignedJobs));
router.get('/mine', protect, asyncHandler(getMyJobs));
router.post('/:jobId/accept', protect, asyncHandler(acceptJob));
router.post('/', protect, asyncHandler(createJob));

export default router;

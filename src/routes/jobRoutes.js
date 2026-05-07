import { Router } from 'express';
import { acceptJob, createJob, getAssignedJobs, getJobById, getMyJobs, getPublicJobs, updateJob, updateJobContractMilestone } from '../controllers/jobController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(getPublicJobs));
router.get('/assigned', protect, asyncHandler(getAssignedJobs));
router.get('/mine', protect, asyncHandler(getMyJobs));
router.get('/:jobId', protect, asyncHandler(getJobById));
router.put('/:jobId', protect, asyncHandler(updateJob));
router.post('/:jobId/contract/milestones/:milestoneIndex/action', protect, asyncHandler(updateJobContractMilestone));
router.post('/:jobId/accept', protect, asyncHandler(acceptJob));
router.post('/', protect, asyncHandler(createJob));

export default router;

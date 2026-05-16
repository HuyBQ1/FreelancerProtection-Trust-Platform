import { Router } from 'express';
import { acceptJob, cancelJob, createJob, deleteJob, downloadJobOnlineContractWord, getAssignedJobs, getCompletedFreelancerJobs, getJobById, getMyJobs, getPublicJobs, selectProposal, signJobOnlineContract, submitProposal, updateJob, updateJobContractMilestone } from '../controllers/jobController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(getPublicJobs));
router.get('/assigned', protect, asyncHandler(getAssignedJobs));
router.get('/completed', protect, asyncHandler(getCompletedFreelancerJobs));
router.get('/completed/:freelancerId', protect, asyncHandler(getCompletedFreelancerJobs));
router.get('/mine', protect, asyncHandler(getMyJobs));
router.get('/:jobId', protect, asyncHandler(getJobById));
router.get('/:jobId/contract/download', protect, asyncHandler(downloadJobOnlineContractWord));
router.put('/:jobId', protect, asyncHandler(updateJob));
router.delete('/:jobId', protect, asyncHandler(deleteJob));
router.post('/:jobId/proposals', protect, asyncHandler(submitProposal));
router.post('/:jobId/proposals/:proposalId/select', protect, asyncHandler(selectProposal));
router.post('/:jobId/contract/milestones/:milestoneIndex/action', protect, asyncHandler(updateJobContractMilestone));
router.post('/:jobId/contract/sign', protect, asyncHandler(signJobOnlineContract));
router.post('/:jobId/accept', protect, asyncHandler(acceptJob));
router.post('/:jobId/cancel', protect, asyncHandler(cancelJob));
router.post('/', protect, asyncHandler(createJob));

export default router;

import { Router } from 'express';
import {
  addEvidence,
  addResponse,
  createDispute,
  getContractDisputes,
  getDisputeById,
  listDisputes,
  updateDisputeStatus,
} from '../controllers/disputeController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', asyncHandler(createDispute));
router.get('/', asyncHandler(listDisputes));
router.get('/contracts/:contractId', asyncHandler(getContractDisputes));
router.get('/:id', asyncHandler(getDisputeById));
router.post('/:id/evidence', asyncHandler(addEvidence));
router.post('/:id/responses', asyncHandler(addResponse));
router.patch('/:id/status', asyncHandler(updateDisputeStatus));

export default router;

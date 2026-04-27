import { Router } from 'express';
import { depositToEscrow, getEscrowSummary, releaseToFreelancer } from '../controllers/escrowController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/deposit', depositToEscrow);
router.post('/release', releaseToFreelancer);
router.get('/summary', getEscrowSummary);

export default router;

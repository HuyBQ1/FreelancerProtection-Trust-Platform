import { Router } from 'express';
import { depositToEscrow, getEscrowSummary, releaseToFreelancer, topUpBalance, withdrawBalance } from '../controllers/escrowController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/deposit', depositToEscrow);
router.post('/release', releaseToFreelancer);
router.post('/top-up', topUpBalance);
router.post('/withdraw', withdrawBalance);
router.get('/summary', getEscrowSummary);

export default router;

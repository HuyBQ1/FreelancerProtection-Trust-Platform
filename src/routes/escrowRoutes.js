import { Router } from 'express';
import { approveWithdrawal, depositToEscrow, getEscrowSummary, getPendingWithdrawals, handleSepayWebhook, rejectWithdrawal, releaseToFreelancer, topUpBalance, withdrawBalance } from '../controllers/escrowController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/sepay/webhook', (req, res) => {
  res.status(200).json({ success: true, message: 'SePay webhook is ready' });
});
router.post('/sepay/webhook', handleSepayWebhook);

router.use(protect);

router.post('/deposit', depositToEscrow);
router.post('/release', releaseToFreelancer);
router.post('/top-up', topUpBalance);
router.post('/withdraw', withdrawBalance);
router.get('/summary', getEscrowSummary);
router.get('/withdrawals/pending', getPendingWithdrawals);
router.patch('/withdrawals/:withdrawalId/approve', approveWithdrawal);
router.patch('/withdrawals/:withdrawalId/reject', rejectWithdrawal);

export default router;

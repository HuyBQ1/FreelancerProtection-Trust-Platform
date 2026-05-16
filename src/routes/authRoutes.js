import { Router } from 'express';
import { login, register, requestRegistrationOtp, verifyRegistrationOtp } from '../controllers/authController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/register/request-otp', asyncHandler(requestRegistrationOtp));
router.post('/register/verify-otp', asyncHandler(verifyRegistrationOtp));
router.post('/login', asyncHandler(login));

export default router;

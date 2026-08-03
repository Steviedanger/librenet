import express from 'express';
import {
  getMyFines,
  getAllFines,
  payFine,
  getFineSummary,
  initiateOnlinePayment,
  verifyOnlinePayment,
} from '../controllers/fineController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student: own unpaid fines
router.get('/my-fines', getMyFines);

// Student: online payment via Paystack
router.post('/:borrowId/initiate-payment', initiateOnlinePayment);
router.get('/verify-payment', verifyOnlinePayment);

// Admin: all fines, summary totals, and marking a fine paid (cash)
router.get('/all', authorize('admin'), getAllFines);
router.get('/summary', authorize('admin'), getFineSummary);
router.patch('/:borrowId/pay', authorize('admin'), payFine);

export default router;
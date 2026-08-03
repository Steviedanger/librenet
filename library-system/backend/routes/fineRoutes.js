import express from 'express';
import {
  getMyFines,
  getAllFines,
  payFine,
  getFineSummary,
} from '../controllers/fineController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student: own unpaid fines
router.get('/my-fines', getMyFines);

// Admin: all fines, summary totals, and marking a fine paid
router.get('/all', authorize('admin'), getAllFines);
router.get('/summary', authorize('admin'), getFineSummary);
router.patch('/:borrowId/pay', authorize('admin'), payFine);

export default router;

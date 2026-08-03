import express from 'express';
import {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows,
  getAllBorrows,
} from '../controllers/borrowController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyBorrows);
router.post('/:bookId', borrowBook);
router.post('/:recordId/return', returnBook);
router.put('/renew/:recordId', renewBorrow); // <-- Renewal route added here

// Admin: all borrow records
router.get('/', authorize('admin'), getAllBorrows);

export default router;
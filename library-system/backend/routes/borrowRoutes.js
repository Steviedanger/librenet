import express from 'express';
import {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
} from '../controllers/borrowController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyBorrows);
router.post('/:bookId', borrowBook);
router.post('/:recordId/return', returnBook);

// Admin: all borrow records
router.get('/', authorize('admin'), getAllBorrows);

export default router;

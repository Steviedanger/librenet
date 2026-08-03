import express from 'express';
import {
  getBookReviews,
  addOrUpdateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/book/:bookId', getBookReviews);
router.post('/book/:bookId', protect, addOrUpdateReview);
router.delete('/:id', protect, deleteReview);

export default router;
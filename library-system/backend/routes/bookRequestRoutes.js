import express from 'express';
import {
  createRequest,
  getMyRequests,
  cancelRequest,
  getAllRequests,
  reviewRequest,
  getRequestSummary,
} from '../controllers/bookRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/', createRequest);
router.get('/my-requests', getMyRequests);
router.delete('/:id', cancelRequest);

// Admin routes
router.get('/all', authorize('admin'), getAllRequests);
router.get('/summary', authorize('admin'), getRequestSummary);
router.patch('/:id/review', authorize('admin'), reviewRequest);

export default router;
import express from 'express';
import {
  getMe,
  updateProfile,
  toggleBookmark,
  getBookmarks,
  saveProgress,
  getProgress,
  getAllUsers,
  setUserStatus,
  verifyUser,
  setUserRole,
  getStats,
  getAnalytics,
  exportBorrowsCSV,
  exportFinesCSV,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Profile
router.get('/me', getMe);
router.put('/me', uploadAvatar, updateProfile);

// Bookmarks
router.get('/bookmarks', getBookmarks);
router.post('/bookmarks/:bookId', toggleBookmark);

// Reading progress
router.get('/progress', getProgress);
router.put('/progress/:bookId', saveProgress);

// Admin — stats and analytics
router.get('/stats', authorize('admin'), getStats);
router.get('/analytics', authorize('admin'), getAnalytics);

// Admin — CSV exports
router.get('/export/borrows', authorize('admin'), exportBorrowsCSV);
router.get('/export/fines', authorize('admin'), exportFinesCSV);

// Admin — user management
router.get('/', authorize('admin'), getAllUsers);
router.patch('/:id/status', authorize('admin'), setUserStatus);
router.patch('/:id/verify', authorize('admin'), verifyUser);
router.patch('/:id/role', authorize('admin'), setUserRole);

export default router;
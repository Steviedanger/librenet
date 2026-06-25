import express from 'express';
import {
  getBooks,
  getGenres,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookFile,
} from '../controllers/bookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadBookFiles } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public catalogue
router.get('/', getBooks);
router.get('/genres', getGenres);
router.get('/:id', getBookById);

// Reader (logged-in students/admins)
router.get('/:id/read', protect, getBookFile);

// Admin management
router.post('/', protect, authorize('admin'), uploadBookFiles, createBook);
router.put('/:id', protect, authorize('admin'), uploadBookFiles, updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

export default router;

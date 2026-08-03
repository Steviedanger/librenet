import Review from '../models/Review.js';
import Book from '../models/Book.js';

// Helper to recalculate and update a book's average rating
const updateBookAverageRating = async (bookId) => {
  const reviews = await Review.find({ book: bookId });
  
  if (reviews.length === 0) {
    await Book.findByIdAndUpdate(bookId, {
      averageRating: 0,
      ratingsCount: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(1);

  await Book.findByIdAndUpdate(bookId, {
    averageRating: parseFloat(averageRating),
    ratingsCount: reviews.length,
  });
};

/**
 * @desc    Get all reviews for a specific book
 * @route   GET /api/reviews/book/:bookId
 * @access  Public
 */
export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ book: bookId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add or update a review for a book
 * @route   POST /api/reviews/book/:bookId
 * @access  Private
 */
export const addOrUpdateReview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // Check if user already reviewed this book
    let review = await Review.findOne({ book: bookId, user: req.user._id });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({
        book: bookId,
        user: req.user._id,
        rating: Number(rating),
        comment,
      });
    }

    // Recalculate book's aggregate rating
    await updateBookAverageRating(bookId);

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({
      message: 'Review saved successfully.',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    // Only review owner or admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    const bookId = review.book;
    await review.deleteOne();

    // Recalculate book's aggregate rating
    await updateBookAverageRating(bookId);

    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
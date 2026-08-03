import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import reviewService from '../services/reviewService.js';
import { resolveAsset, initials } from '../utils/helpers.js';

const StarRating = ({ rating, setRating, interactive = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${
            interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
          } text-lg ${
            star <= (hover || rating) ? 'text-amber-400' : 'text-cream-300/30'
          }`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ bookId, onReviewUpdated }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState({ busy: false, err: '', success: '' });

  const loadReviews = async () => {
    try {
      const data = await reviewService.getByBook(bookId);
      setReviews(data.reviews);

      // Pre-fill user review if already existing
      const existing = data.reviews.find((r) => r.user?._id === user?._id);
      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment);
      }
    } catch {
      // Ignore initial load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId) loadReviews();
  }, [bookId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setStatus({ busy: true, err: '', success: '' });
    try {
      await reviewService.addOrUpdate(bookId, { rating, comment });
      setStatus({ busy: false, err: '', success: 'Review submitted!' });
      await loadReviews();
      if (onReviewUpdated) onReviewUpdated();
    } catch (err) {
      setStatus({
        busy: false,
        err: err.response?.data?.message || 'Failed to submit review.',
        success: '',
      });
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.remove(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      if (onReviewUpdated) onReviewUpdated();
    } catch {
      alert('Failed to delete review');
    }
  };

  return (
    <div className="mt-12 border-t border-cream-300/10 pt-8">
      <h2 className="font-serif text-2xl font-bold text-cream-100">
        Community Reviews & Ratings ({reviews.length})
      </h2>

      {/* Review Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5">
          <h3 className="font-medium text-cream-200">Leave your review</h3>

          {status.err && (
            <p className="rounded-lg bg-red-500/15 p-2.5 text-xs text-red-300">
              {status.err}
            </p>
          )}
          {status.success && (
            <p className="rounded-lg bg-forest-500/15 p-2.5 text-xs text-forest-300">
              {status.success}
            </p>
          )}

          <div>
            <label className="label text-xs">Your Rating</label>
            <StarRating rating={rating} setRating={setRating} interactive />
          </div>

          <div>
            <label className="label text-xs" htmlFor="review-comment">
              Your Feedback
            </label>
            <textarea
              id="review-comment"
              rows={3}
              className="input text-sm"
              placeholder="What did you think of this book?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary text-xs"
            disabled={status.busy}
          >
            {status.busy ? 'Posting…' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-cream-300/70">
          Please log in to leave a review and rate this book.
        </p>
      )}

      {/* Review List */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-cream-300/50">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-cream-300/50">
            No reviews yet. Be the first to share your thoughts!
          </p>
        ) : (
          reviews.map((r) => (
            <div
              key={r._id}
              className="rounded-xl border border-cream-300/10 bg-navy-800/40 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.user?.avatar ? (
                    <img
                      src={resolveAsset(r.user.avatar)}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-500 text-xs font-semibold text-navy-900">
                      {initials(r.user?.name) || 'U'}
                    </span>
                  )}
                  <div>
                    <span className="block text-xs font-semibold text-cream-100">
                      {r.user?.name || 'Anonymous Student'}
                    </span>
                    <span className="block text-[10px] text-cream-300/50">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StarRating rating={r.rating} />
                  {(user?._id === r.user?._id || user?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(r._id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-cream-200">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
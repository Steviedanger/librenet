import { Link } from 'react-router-dom';
import { resolveAsset } from '../utils/helpers.js';

/**
 * Catalogue tile for a single book. Soft shadow + hover lift, with an
 * availability badge and an optional bookmark toggle.
 */
const BookCard = ({ book, bookmarked = false, onToggleBookmark }) => {
  const available = book.availableCopies > 0;

  return (
    <article className="group card overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/books/${book._id}`} className="block" aria-label={`View ${book.title}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-navy-700">
          {book.coverImage ? (
            <img
              src={resolveAsset(book.coverImage)}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center font-serif text-cream-200">
              {book.title}
            </div>
          )}
          <span
            className={`badge absolute left-2 top-2 ${
              available
                ? 'bg-forest-500/90 text-navy-900'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {available ? `${book.availableCopies} available` : 'Borrowed out'}
          </span>
        </div>
      </Link>

      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/books/${book._id}`} className="min-w-0">
            <h3 className="truncate font-serif text-lg font-semibold text-cream-100">
              {book.title}
            </h3>
          </Link>
          {onToggleBookmark && (
            <button
              onClick={() => onToggleBookmark(book._id)}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              className="shrink-0 text-xl leading-none transition-transform hover:scale-110"
              title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <span className={bookmarked ? 'text-forest-300' : 'text-cream-300/40'}>
                {bookmarked ? '★' : '☆'}
              </span>
            </button>
          )}
        </div>
        <p className="truncate text-sm text-cream-300">{book.author}</p>
        <div className="flex items-center gap-2 pt-1 text-xs text-cream-300/60">
          <span className="badge bg-navy-700 text-forest-300">{book.genre}</span>
          <span>{book.publishedYear}</span>
        </div>
      </div>
    </article>
  );
};

export default BookCard;

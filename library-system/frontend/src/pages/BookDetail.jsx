import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import bookService from '../services/bookService.js';
import useAuth from '../hooks/useAuth.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { resolveAsset } from '../utils/helpers.js';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null); // user's active loan
  const [action, setAction] = useState({ busy: false, msg: '', err: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);

    const tasks = [bookService.get(id)];
    if (isAuthenticated) {
      tasks.push(bookService.bookmarks(), bookService.myBorrows());
    }

    Promise.all(tasks)
      .then(([bookRes, bookmarksRes, borrowsRes]) => {
        if (!active) return;
        setBook(bookRes.book);
        if (bookmarksRes) {
          setBookmarked(bookmarksRes.books.some((b) => b._id === id));
        }
        if (borrowsRes) {
          const rec = borrowsRes.records.find(
            (r) => r.book?._id === id && r.status !== 'returned'
          );
          setActiveRecord(rec || null);
        }
      })
      .catch((err) =>
        active && setError(err.response?.data?.message || 'Book not found')
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  const requireLogin = () => navigate('/login', { state: { from: { pathname: `/books/${id}` } } });

  const handleBorrow = async () => {
    if (!isAuthenticated) return requireLogin();
    setAction({ busy: true, msg: '', err: '' });
    try {
      const { record } = await bookService.borrow(id);
      setActiveRecord(record);
      setBook((b) => ({ ...b, availableCopies: b.availableCopies - 1 }));
      setAction({ busy: false, msg: 'Borrowed! Due in 14 days.', err: '' });
    } catch (err) {
      setAction({ busy: false, msg: '', err: err.response?.data?.message || 'Could not borrow' });
    }
  };

  const handleReturn = async () => {
    if (!activeRecord) return;
    setAction({ busy: true, msg: '', err: '' });
    try {
      await bookService.returnBook(activeRecord._id);
      setActiveRecord(null);
      setBook((b) => ({ ...b, availableCopies: b.availableCopies + 1 }));
      setAction({ busy: false, msg: 'Returned. Thanks!', err: '' });
    } catch (err) {
      setAction({ busy: false, msg: '', err: err.response?.data?.message || 'Could not return' });
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) return requireLogin();
    try {
      const { bookmarked: now } = await bookService.toggleBookmark(id);
      setBookmarked(now);
    } catch {
      /* ignore */
    }
  };

  if (loading) return <LoadingSpinner className="py-32" />;
  if (error || !book)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-red-300">{error || 'Book not found'}</p>
        <Link to="/library" className="btn-outline mt-5">Back to library</Link>
      </div>
    );

  const available = book.availableCopies > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/library" className="text-sm text-forest-300 hover:underline">
        ← Back to library
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[300px,1fr]">
        {/* Cover */}
        <div>
          <div className="card overflow-hidden">
            {book.coverImage ? (
              <img
                src={resolveAsset(book.coverImage)}
                alt={`Cover of ${book.title}`}
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center p-6 text-center font-serif text-cream-200">
                {book.title}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <span className="badge bg-navy-700 text-forest-300">{book.genre}</span>
          <h1 className="mt-3 font-serif text-3xl md:text-4xl">{book.title}</h1>
          <p className="mt-1 text-lg text-cream-300">by {book.author}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-cream-300/50">Published</dt>
              <dd className="text-cream-100">{book.publishedYear}</dd>
            </div>
            <div>
              <dt className="text-cream-300/50">Availability</dt>
              <dd className={available ? 'text-forest-300' : 'text-red-300'}>
                {available ? `${book.availableCopies} of ${book.totalCopies}` : 'None available'}
              </dd>
            </div>
            {book.pageCount > 0 && (
              <div>
                <dt className="text-cream-300/50">Pages</dt>
                <dd className="text-cream-100">{book.pageCount}</dd>
              </div>
            )}
          </dl>

          <p className="mt-5 leading-relaxed text-cream-200/90">
            {book.description || 'No description available.'}
          </p>

          {(action.msg || action.err) && (
            <p
              role="status"
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                action.err ? 'bg-red-500/15 text-red-300' : 'bg-forest-500/15 text-forest-300'
              }`}
            >
              {action.err || action.msg}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {activeRecord ? (
              <button onClick={handleReturn} className="btn-outline" disabled={action.busy}>
                {action.busy ? 'Working…' : 'Return book'}
              </button>
            ) : (
              <button
                onClick={handleBorrow}
                className="btn-primary"
                disabled={action.busy || !available}
              >
                {available ? (action.busy ? 'Working…' : 'Borrow for 14 days') : 'Unavailable'}
              </button>
            )}

            {book.pdfFile && (
              <Link to={`/read/${book._id}`} className="btn-outline">
                Read online
              </Link>
            )}

            <button onClick={handleBookmark} className="btn-ghost" aria-pressed={bookmarked}>
              <span className={bookmarked ? 'text-forest-300' : ''}>
                {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;

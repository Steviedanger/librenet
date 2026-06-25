import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService.js';
import useAuth from '../hooks/useAuth.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  resolveAsset,
  formatDate,
  daysUntil,
  statusBadgeClass,
} from '../utils/helpers.js';

const TABS = [
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'reading', label: 'Reading progress' },
  { key: 'bookmarks', label: 'Bookmarks' },
  { key: 'history', label: 'History' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('borrowed');
  const [loading, setLoading] = useState(true);
  const [borrows, setBorrows] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, bm, pr] = await Promise.all([
        bookService.myBorrows(),
        bookService.bookmarks(),
        bookService.progress(),
      ]);
      setBorrows(b.records);
      setBookmarks(bm.books);
      setProgress(pr.items);
    } catch {
      /* errors surface as empty states */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleReturn = async (recordId) => {
    setBusyId(recordId);
    try {
      await bookService.returnBook(recordId);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveBookmark = async (bookId) => {
    await bookService.toggleBookmark(bookId);
    setBookmarks((prev) => prev.filter((b) => b._id !== bookId));
  };

  const active = borrows.filter((r) => r.status !== 'returned');
  const returned = borrows.filter((r) => r.status === 'returned');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-cream-300">Your reading at a glance.</p>
        </div>
        <Link to="/profile" className="btn-outline text-sm">Account settings</Link>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Borrowed', value: active.length },
          { label: 'Overdue', value: active.filter((r) => r.status === 'overdue').length },
          { label: 'Bookmarks', value: bookmarks.length },
          { label: 'In progress', value: progress.length },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="font-serif text-3xl text-forest-300">{s.value}</div>
            <div className="text-sm text-cream-300/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-cream-300/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-forest-300 text-forest-300'
                : 'border-transparent text-cream-300 hover:text-cream-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <>
            {tab === 'borrowed' && (
              <BorrowedList records={active} busyId={busyId} onReturn={handleReturn} />
            )}
            {tab === 'reading' && <ProgressList items={progress} />}
            {tab === 'bookmarks' && (
              <BookmarkList books={bookmarks} onRemove={handleRemoveBookmark} />
            )}
            {tab === 'history' && <HistoryList records={returned} />}
          </>
        )}
      </div>
    </div>
  );
};

/* ------------------------------- Sub-views -------------------------------- */

const EmptyState = ({ children }) => (
  <p className="py-12 text-center text-cream-300/60">{children}</p>
);

const BookRow = ({ book, children }) => (
  <div className="card flex items-center gap-4 p-3">
    <Link to={`/books/${book._id}`} className="shrink-0">
      {book.coverImage ? (
        <img
          src={resolveAsset(book.coverImage)}
          alt=""
          className="h-20 w-14 rounded object-cover"
        />
      ) : (
        <div className="flex h-20 w-14 items-center justify-center rounded bg-navy-700 text-xs">
          📕
        </div>
      )}
    </Link>
    <div className="min-w-0 flex-1">
      <Link to={`/books/${book._id}`} className="block truncate font-serif text-lg hover:text-forest-300">
        {book.title}
      </Link>
      <p className="truncate text-sm text-cream-300">{book.author}</p>
      {children}
    </div>
  </div>
);

const BorrowedList = ({ records, busyId, onReturn }) => {
  if (!records.length) return <EmptyState>You haven’t borrowed any books yet.</EmptyState>;
  return (
    <div className="space-y-3">
      {records.map((r) => {
        const left = daysUntil(r.dueDate);
        const overdue = r.status === 'overdue' || left < 0;
        return (
          <BookRow key={r._id} book={r.book}>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
              <span className={`badge ${statusBadgeClass(overdue ? 'overdue' : 'active')}`}>
                {overdue ? 'Overdue' : 'Active'}
              </span>
              <span className="text-cream-300/70">Due {formatDate(r.dueDate)}</span>
              <span className={overdue ? 'text-red-300' : 'text-cream-300/70'}>
                {overdue ? `${Math.abs(left)} day(s) overdue` : `${left} day(s) left`}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {r.book?.pdfFile && (
                <Link to={`/read/${r.book._id}`} className="btn-ghost px-3 py-1 text-xs">
                  Read
                </Link>
              )}
              <button
                onClick={() => onReturn(r._id)}
                className="btn-outline px-3 py-1 text-xs"
                disabled={busyId === r._id}
              >
                {busyId === r._id ? 'Returning…' : 'Return'}
              </button>
            </div>
          </BookRow>
        );
      })}
    </div>
  );
};

const ProgressList = ({ items }) => {
  if (!items.length) return <EmptyState>No reading progress recorded yet.</EmptyState>;
  return (
    <div className="space-y-3">
      {items.map((p) => (
        <BookRow key={p.book._id} book={p.book}>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-cream-300/70">
              <span>Page {p.currentPage}{p.book.pageCount ? ` of ${p.book.pageCount}` : ''}</span>
              <span>{p.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
              <div className="h-full rounded-full bg-forest-400" style={{ width: `${p.percent}%` }} />
            </div>
            <Link to={`/read/${p.book._id}`} className="mt-2 inline-block text-xs text-forest-300 hover:underline">
              Continue reading →
            </Link>
          </div>
        </BookRow>
      ))}
    </div>
  );
};

const BookmarkList = ({ books, onRemove }) => {
  if (!books.length) return <EmptyState>No bookmarks yet. Tap ☆ on any book to save it.</EmptyState>;
  return (
    <div className="space-y-3">
      {books.map((b) => (
        <BookRow key={b._id} book={b}>
          <button onClick={() => onRemove(b._id)} className="mt-2 text-xs text-forest-300 hover:underline">
            ★ Remove bookmark
          </button>
        </BookRow>
      ))}
    </div>
  );
};

const HistoryList = ({ records }) => {
  if (!records.length) return <EmptyState>No returned books yet.</EmptyState>;
  return (
    <div className="space-y-3">
      {records.map((r) => (
        <BookRow key={r._id} book={r.book}>
          <p className="mt-1 text-xs text-cream-300/70">
            Borrowed {formatDate(r.borrowedAt)} · Returned {formatDate(r.returnedAt)}
          </p>
        </BookRow>
      ))}
    </div>
  );
};

export default Dashboard;

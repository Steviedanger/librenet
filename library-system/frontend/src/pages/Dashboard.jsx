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
  formatGHS,
} from '../utils/helpers.js';
import api from '../services/api.js';

const TABS = [
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'reading', label: 'Reading progress' },
  { key: 'bookmarks', label: 'Bookmarks' },
  { key: 'history', label: 'History' },
  { key: 'badges', label: 'Badges' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('borrowed');
  const [loading, setLoading] = useState(true);
  const [borrows, setBorrows] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [fines, setFines] = useState({ fines: [], total: 0, count: 0 });
  const [busyId, setBusyId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, bm, pr, fn] = await Promise.all([
        bookService.myBorrows(),
        bookService.bookmarks(),
        bookService.progress(),
        bookService.myFines(),
      ]);
      setBorrows(b.records);
      setBookmarks(bm.books);
      setProgress(pr.items);
      setFines(fn);
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
      const res = await bookService.returnBook(recordId);
      // Show badge popup if new badges were earned
      if (res.newBadges && res.newBadges.length > 0) {
        setNewBadges(res.newBadges);
      }
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleRenew = async (recordId) => {
    setBusyId(recordId);
    try {
      const res = await bookService.renewLoan(recordId);
      alert(res.message || 'Loan extended by 7 days!');
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not extend loan.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePayOnline = async (borrowId) => {
    setPayingId(borrowId);
    try {
      const res = await api.post(`/fines/${borrowId}/initiate-payment`);
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate payment. Please try again.');
    } finally {
      setPayingId(null);
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

      {/* Badge congratulations popup */}
      {newBadges.length > 0 && (
        <BadgePopup badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-cream-300">Your reading at a glance.</p>
          {user?.libraryId && (
            <span className="badge mt-2 border border-forest-300/30 bg-forest-500/15 font-mono text-sm text-forest-300">
              Library ID · {user.libraryId}
            </span>
          )}
        </div>
        <Link to="/profile" className="btn-outline text-sm">Account settings</Link>
      </div>

      {/* Outstanding fines alert */}
      {fines.total > 0 && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="font-semibold text-red-200">
                  You have outstanding fines: {formatGHS(fines.total)}
                </p>
                <p className="text-sm text-red-300/80">
                  Please settle your outstanding fines to restore full account borrowing privileges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* My Fines */}
      {!loading && fines.fines.length > 0 && (
        <FinesSection
          fines={fines.fines}
          total={fines.total}
          payingId={payingId}
          onPayOnline={handlePayOnline}
        />
      )}

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
            {t.key === 'badges' && user?.badges?.length > 0 && (
              <span className="ml-1.5 rounded-full bg-forest-500/30 px-1.5 py-0.5 text-xs text-forest-300">
                {user.badges.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <>
            {tab === 'borrowed' && (
              <BorrowedList
                records={active}
                busyId={busyId}
                onReturn={handleReturn}
                onRenew={handleRenew}
              />
            )}
            {tab === 'reading' && <ProgressList items={progress} />}
            {tab === 'bookmarks' && (
              <BookmarkList books={bookmarks} onRemove={handleRemoveBookmark} />
            )}
            {tab === 'history' && <HistoryList records={returned} />}
            {tab === 'badges' && <BadgesList badges={user?.badges || []} totalBorrows={user?.totalBorrows || 0} totalBooksRead={user?.totalBooksRead || 0} />}
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

/* Badge congratulations popup */
const BadgePopup = ({ badges, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="card w-full max-w-sm p-8 text-center">
      <div className="text-5xl mb-2">🎉</div>
      <h2 className="font-serif text-2xl text-forest-300">
        {badges.length === 1 ? 'Badge Earned!' : 'Badges Earned!'}
      </h2>
      <p className="mt-1 text-sm text-cream-300/70">Keep up the great reading!</p>
      <div className="mt-6 space-y-3">
        {badges.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-xl border border-forest-300/20 bg-forest-500/10 p-3">
            <span className="text-3xl">{b.icon}</span>
            <div className="text-left">
              <p className="font-semibold text-cream-100">{b.name}</p>
              <p className="text-xs text-cream-300/70">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="btn-primary mt-6 w-full">
        Awesome! 🚀
      </button>
    </div>
  </div>
);

/* Badges tab */
const ALL_BADGE_DEFS = [
  { id: 'new_member', name: 'New Member', description: 'Borrowed your first book', icon: '🆕' },
  { id: 'regular_reader', name: 'Regular Reader', description: 'Borrowed 10 books', icon: '⭐' },
  { id: 'power_reader', name: 'Power Reader', description: 'Borrowed 25 books', icon: '🔥' },
  { id: 'first_read', name: 'First Read', description: 'Finished your first book', icon: '🥇' },
  { id: 'bookworm', name: 'Bookworm', description: 'Read 5 books', icon: '📚' },
  { id: 'scholar', name: 'Scholar', description: 'Read 10 books', icon: '🎓' },
  { id: 'bibliophile', name: 'Bibliophile', description: 'Read 25 books', icon: '📖' },
  { id: 'on_time', name: 'On Time', description: 'Returned 5 books before due date', icon: '✅' },
  { id: 'early_bird', name: 'Early Bird', description: 'Returned 10 books before due date', icon: '⚡' },
  { id: 'perfect_record', name: 'Perfect Record', description: 'Never received a fine', icon: '🏅' },
];

const BadgesList = ({ badges, totalBorrows, totalBooksRead }) => {
  const earnedIds = new Set(badges.map((b) => b.id));

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="card p-4 text-center min-w-[120px]">
          <div className="font-serif text-3xl text-forest-300">{badges.length}</div>
          <div className="text-xs text-cream-300/70">Badges earned</div>
        </div>
        <div className="card p-4 text-center min-w-[120px]">
          <div className="font-serif text-3xl text-forest-300">{totalBorrows}</div>
          <div className="text-xs text-cream-300/70">Total borrows</div>
        </div>
        <div className="card p-4 text-center min-w-[120px]">
          <div className="font-serif text-3xl text-forest-300">{totalBooksRead}</div>
          <div className="text-xs text-cream-300/70">Books read</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ALL_BADGE_DEFS.map((def) => {
          const earned = earnedIds.has(def.id);
          const earnedData = badges.find((b) => b.id === def.id);
          return (
            <div
              key={def.id}
              className={`rounded-xl border p-4 transition-all ${
                earned
                  ? 'border-forest-300/30 bg-forest-500/10'
                  : 'border-cream-300/10 bg-navy-800/40 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-3xl ${!earned && 'grayscale'}`}>
                  {earned ? def.icon : '🔒'}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${earned ? 'text-cream-100' : 'text-cream-300/50'}`}>
                    {def.name}
                  </p>
                  <p className="text-xs text-cream-300/50">{def.description}</p>
                  {earned && earnedData?.earnedAt && (
                    <p className="text-xs text-forest-300 mt-0.5">
                      ✓ Earned {formatDate(earnedData.earnedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {badges.length === 0 && (
        <p className="mt-6 text-center text-sm text-cream-300/50">
          No badges yet — start borrowing and returning books to earn them! 🏆
        </p>
      )}
    </div>
  );
};

const FinesSection = ({ fines, total, payingId, onPayOnline }) => (
  <section className="mt-8">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-serif text-2xl text-red-200">My fines</h2>
      <span className="badge bg-red-500/20 text-red-300">
        Total due {formatGHS(total)}
      </span>
    </div>
    <p className="mt-1 text-sm text-cream-300/70">
      Pay your outstanding fine balance online or visit the library to pay in cash.
    </p>

    <div className="mt-4 overflow-x-auto rounded-xl border border-red-500/20">
      <table className="w-full text-left text-sm">
        <thead className="bg-navy-800 text-cream-300/70">
          <tr>
            <th className="px-4 py-3 font-medium">Book title</th>
            <th className="px-4 py-3 font-medium">Due date</th>
            <th className="px-4 py-3 font-medium">Days overdue</th>
            <th className="px-4 py-3 font-medium text-right">Fine (GHS)</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {fines.map((f) => (
            <tr key={f._id} className="border-t border-cream-300/10">
              <td className="px-4 py-3 text-cream-100">
                {f.book?.title || 'Deleted book'}
              </td>
              <td className="px-4 py-3 text-cream-300">{formatDate(f.dueDate)}</td>
              <td className="px-4 py-3 text-red-300">{f.daysOverdue} day(s)</td>
              <td className="px-4 py-3 text-right font-medium text-red-300">
                {formatGHS(f.fineAmount)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onPayOnline(f._id)}
                  disabled={payingId === f._id}
                  className="rounded-lg bg-forest-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-400 disabled:opacity-50 transition-colors"
                >
                  {payingId === f._id ? 'Redirecting…' : '💳 Pay Online'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-red-500/30 bg-navy-800/60">
            <td colSpan={3} className="px-4 py-3 text-right font-medium text-cream-200">
              Total outstanding
            </td>
            <td className="px-4 py-3 text-right font-semibold text-red-300">
              {formatGHS(total)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>

    <p className="mt-3 text-xs text-cream-300/50">
      💳 Online payments are processed securely via Paystack. · 
      🏦 To pay in cash, visit the library and present your Library ID.
    </p>
  </section>
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

const BorrowedList = ({ records, busyId, onReturn, onRenew }) => {
  if (!records.length) return <EmptyState>You haven't borrowed any books yet.</EmptyState>;
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
              {overdue && r.fineAmount > 0 && (
                <span className="badge bg-red-500/20 text-red-300">
                  Fine {formatGHS(r.fineAmount)}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
                {busyId === r._id ? 'Working…' : 'Return'}
              </button>

              {!overdue && (
                !r.renewed ? (
                  <button
                    onClick={() => onRenew(r._id)}
                    className="btn-ghost text-xs text-forest-300 border border-forest-300/30 hover:bg-forest-500/10 px-3 py-1"
                    disabled={busyId === r._id}
                  >
                    🔄 Extend 7 Days
                  </button>
                ) : (
                  <span className="text-[11px] text-cream-300/50 italic self-center">
                    (Renewed)
                  </span>
                )
              )}
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
          {r.finePaid && (
            <p className="text-xs text-green-400 mt-0.5">
              ✓ Fine paid {r.paymentMethod === 'ONLINE' ? 'online' : 'in cash'} — {formatGHS(r.fineAmount)}
            </p>
          )}
        </BookRow>
      ))}
    </div>
  );
};

export default Dashboard;
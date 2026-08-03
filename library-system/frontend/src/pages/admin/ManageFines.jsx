import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDate, formatGHS } from '../../utils/helpers.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'paid', label: 'Paid' },
];

const ManageFines = () => {
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unpaid');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? undefined : { status: filter };
      const [f, s] = await Promise.all([
        bookService.allFines(params),
        bookService.fineSummary(),
      ]);
      setFines(f.fines);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markPaid = async (fine) => {
    setBusyId(fine._id);
    try {
      await bookService.payFine(fine._id);
      // Refresh so both the row and the summary cards stay in sync.
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const cards = [
    {
      label: 'Total outstanding',
      value: formatGHS(summary?.totalOutstanding ?? 0),
      accent: 'text-red-300',
    },
    {
      label: 'Total collected',
      value: formatGHS(summary?.totalCollected ?? 0),
      accent: 'text-forest-300',
    },
    {
      label: 'Overdue books',
      value: summary?.overdueBooks ?? 0,
      accent: 'text-orange-300',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/admin" className="text-sm text-forest-300 hover:underline">← Admin</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl md:text-4xl">Manage fines</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm ${
                filter === f.key ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className={`font-serif text-3xl ${c.accent}`}>{c.value}</div>
            <div className="text-sm text-cream-300/70">{c.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-cream-300/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-cream-300/70">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Borrowed</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Days overdue</th>
                <th className="px-4 py-3 font-medium text-right">Fine (GHS)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-cream-100">
                        {f.user?.name || '—'}
                      </div>
                      <div className="truncate text-xs text-cream-300/70">
                        {f.user?.email || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream-100">
                    {f.book?.title || 'Deleted book'}
                  </td>
                  <td className="px-4 py-3 text-cream-300">{formatDate(f.borrowedAt)}</td>
                  <td className="px-4 py-3 text-cream-300">{formatDate(f.dueDate)}</td>
                  <td className="px-4 py-3 text-red-300">{f.daysOverdue}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-300">
                    {formatGHS(f.fineAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        f.finePaid
                          ? 'bg-forest-500/20 text-forest-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {f.finePaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f.finePaid ? (
                      <span className="text-xs text-cream-300/50">
                        {f.finePaidBy ? `by ${f.finePaidBy}` : 'Paid'}
                      </span>
                    ) : (
                      <button
                        onClick={() => markPaid(f)}
                        className="btn-primary px-3 py-1 text-xs"
                        disabled={busyId === f._id}
                      >
                        {busyId === f._id ? '…' : 'Mark as paid'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {fines.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-cream-300/60">
                    No fines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageFines;

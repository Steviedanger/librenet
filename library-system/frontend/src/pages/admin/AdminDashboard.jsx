import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { resolveAsset, formatDate, statusBadgeClass } from '../../utils/helpers.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookService.stats(), bookService.allBorrows()])
      .then(([s, b]) => {
        setStats(s);
        setRecent(b.records.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-32" />;

  const cards = [
    { label: 'Total books', value: stats?.totalBooks ?? 0, icon: '📚' },
    { label: 'Total users', value: stats?.totalUsers ?? 0, icon: '👥' },
    { label: 'Currently borrowed', value: stats?.booksBorrowed ?? 0, icon: '📤' },
    { label: 'Copies available', value: stats?.availableCopies ?? 0, icon: '✅' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl md:text-4xl">Admin console</h1>
        <div className="flex gap-2">
          <Link to="/admin/books" className="btn-primary text-sm">Manage books</Link>
          <Link to="/admin/users" className="btn-outline text-sm">Manage users</Link>
          <Link to="/admin/fines" className="btn-outline text-sm">Fines</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-2xl" aria-hidden="true">{c.icon}</div>
            <div className="mt-2 font-serif text-3xl text-forest-300">{c.value}</div>
            <div className="text-sm text-cream-300/70">{c.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-2xl">Recent borrow activity</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-cream-300/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-800 text-cream-300/70">
            <tr>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Reader</th>
              <th className="px-4 py-3 font-medium">Borrowed</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-cream-300/60">
                  No borrow records yet.
                </td>
              </tr>
            ) : (
              recent.map((r) => (
                <tr key={r._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.book?.coverImage && (
                        <img src={resolveAsset(r.book.coverImage)} alt="" className="h-10 w-7 rounded object-cover" />
                      )}
                      <span className="text-cream-100">{r.book?.title || 'Deleted book'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream-300">{r.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-cream-300">{formatDate(r.borrowedAt)}</td>
                  <td className="px-4 py-3 text-cream-300">{formatDate(r.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;

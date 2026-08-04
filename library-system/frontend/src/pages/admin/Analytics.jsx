import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService.js';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { resolveAsset, formatGHS } from '../../utils/helpers.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BAR_COLORS = [
  '#4ade80', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
  '#f472b6', '#fb923c', '#facc15', '#a3e635', '#2dd4bf',
];

const Analytics = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookService.analytics(year);
      setData(res);
    } catch {
      /* show empty state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const endpoint = type === 'borrows' ? '/users/export/borrows' : '/users/export/fines';
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `librenet-${type}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  if (loading) return <LoadingSpinner className="py-32" />;

  const maxBorrows = Math.max(...(data?.monthlyData?.map((m) => m.totalBorrows) || [1]), 1);
  const maxGenre = Math.max(...(data?.genrePopularity?.map((g) => g.totalBorrows) || [1]), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm text-forest-300 hover:underline">← Admin</Link>
          <h1 className="font-serif text-3xl md:text-4xl">Analytics</h1>
          <p className="mt-1 text-sm text-cream-300/70">Library performance and usage insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('borrows')}
            disabled={exporting === 'borrows'}
            className="btn-outline text-sm"
          >
            {exporting === 'borrows' ? 'Exporting…' : '⬇ Export Borrows CSV'}
          </button>
          <button
            onClick={() => handleExport('fines')}
            disabled={exporting === 'fines'}
            className="btn-outline text-sm"
          >
            {exporting === 'fines' ? 'Exporting…' : '⬇ Export Fines CSV'}
          </button>
        </div>
      </div>

      {/* Year selector */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-cream-300/70">Year:</span>
        <div className="flex gap-2">
          {(data?.availableYears || [currentYear]).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                year === y
                  ? 'bg-forest-500 text-white'
                  : 'border border-cream-300/20 text-cream-300 hover:border-forest-300/50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: 'Total Borrows',
            value: data?.monthlyData?.reduce((s, m) => s + m.totalBorrows, 0) || 0,
            icon: '📤',
            color: 'text-forest-300',
          },
          {
            label: 'Overdue Books',
            value: data?.fineStats?.overdueCount || 0,
            icon: '⚠️',
            color: 'text-red-300',
          },
          {
            label: 'Fines Collected',
            value: formatGHS(data?.fineStats?.totalCollected || 0),
            icon: '💰',
            color: 'text-amber-300',
          },
          {
            label: 'Most Active Genre',
            value: data?.genrePopularity?.[0]?.genre || '—',
            icon: '📚',
            color: 'text-blue-300',
          },
        ].map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-2xl">{c.icon}</div>
            <div className={`mt-2 font-serif text-2xl ${c.color}`}>{c.value}</div>
            <div className="text-xs text-cream-300/70">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly borrows chart */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Monthly Borrowing — {year}</h2>
        <p className="mt-1 text-sm text-cream-300/70">Total books borrowed per month</p>
        <div className="card mt-4 p-6">
          <div className="flex items-end gap-2 h-48">
            {data?.monthlyData?.map((m, i) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-cream-300/60">
                  {m.totalBorrows > 0 ? m.totalBorrows : ''}
                </span>
                <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: '160px' }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${(m.totalBorrows / maxBorrows) * 100}%`,
                      minHeight: m.totalBorrows > 0 ? '4px' : '0',
                      backgroundColor: '#4ade80',
                    }}
                    title={`${m.month}: ${m.totalBorrows} borrows`}
                  />
                </div>
                <span className="text-xs text-cream-300/50">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-cream-300/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-forest-400" />
              Borrows
            </span>
          </div>
        </div>
      </section>

      {/* New users per month */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl">New Registrations — {year}</h2>
        <p className="mt-1 text-sm text-cream-300/70">Students who joined each month</p>
        <div className="card mt-4 p-6">
          <div className="flex items-end gap-2 h-32">
            {data?.monthlyData?.map((m) => {
              const maxNew = Math.max(...(data.monthlyData.map((x) => x.newUsers)), 1);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-cream-300/60">
                    {m.newUsers > 0 ? m.newUsers : ''}
                  </span>
                  <div className="w-full flex justify-end flex-col" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${(m.newUsers / maxNew) * 100}%`,
                        minHeight: m.newUsers > 0 ? '4px' : '0',
                        backgroundColor: '#60a5fa',
                      }}
                      title={`${m.month}: ${m.newUsers} new users`}
                    />
                  </div>
                  <span className="text-xs text-cream-300/50">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Genre popularity */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Genre Popularity</h2>
        <p className="mt-1 text-sm text-cream-300/70">Most borrowed genres across all time</p>
        <div className="card mt-4 p-6 space-y-3">
          {data?.genrePopularity?.length === 0 && (
            <p className="text-center text-cream-300/60 py-8">No data yet.</p>
          )}
          {data?.genrePopularity?.map((g, i) => (
            <div key={g.genre} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-cream-300 truncate">{g.genre}</span>
              <div className="flex-1 h-6 rounded-full bg-navy-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(g.totalBorrows / maxGenre) * 100}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
              <span className="w-10 text-right text-sm text-cream-300/70">{g.totalBorrows}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Most borrowed books */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Most Borrowed Books</h2>
        <p className="mt-1 text-sm text-cream-300/70">Top 10 books by total borrows</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-cream-300/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-cream-300/70">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Genre</th>
                <th className="px-4 py-3 font-medium text-right">Borrows</th>
                <th className="px-4 py-3 font-medium text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {data?.mostBorrowedBooks?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-cream-300/60">No data yet.</td>
                </tr>
              )}
              {data?.mostBorrowedBooks?.map((b, i) => (
                <tr key={b._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3 text-cream-300/50 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.coverImage ? (
                        <img src={resolveAsset(b.coverImage)} alt="" className="h-10 w-7 rounded object-cover" />
                      ) : (
                        <div className="flex h-10 w-7 items-center justify-center rounded bg-navy-700 text-xs">📕</div>
                      )}
                      <div>
                        <p className="text-cream-100">{b.title}</p>
                        <p className="text-xs text-cream-300/60">{b.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream-300">{b.genre}</td>
                  <td className="px-4 py-3 text-right font-semibold text-forest-300">{b.totalBorrows}</td>
                  <td className="px-4 py-3 text-right text-cream-300">
                    {b.availableCopies}/{b.totalCopies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Most active students */}
      <section className="mt-10 mb-10">
        <h2 className="font-serif text-2xl">Most Active Students</h2>
        <p className="mt-1 text-sm text-cream-300/70">Top 10 students by total borrows</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-cream-300/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-cream-300/70">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Library ID</th>
                <th className="px-4 py-3 font-medium text-right">Total Borrows</th>
                <th className="px-4 py-3 font-medium text-right">On Time Returns</th>
              </tr>
            </thead>
            <tbody>
              {data?.mostActiveUsers?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-cream-300/60">No data yet.</td>
                </tr>
              )}
              {data?.mostActiveUsers?.map((u, i) => (
                <tr key={u._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3 text-cream-300/50 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={resolveAsset(u.avatar)} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500 text-xs font-semibold text-navy-900">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-cream-100">{u.name}</p>
                        <p className="text-xs text-cream-300/60">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-cream-300">{u.libraryId || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-forest-300">{u.totalBorrows}</td>
                  <td className="px-4 py-3 text-right text-cream-300">{u.returnedOnTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default Analytics;
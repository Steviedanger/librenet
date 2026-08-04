import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDate } from '../../utils/helpers.js';

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-blue-500/20 text-blue-300',
  rejected: 'bg-red-500/20 text-red-300',
  added: 'bg-forest-500/20 text-forest-300',
};

const STATUS_ICONS = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
  added: '📚',
};

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, added: 0, total: 0 });
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', adminNote: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, sumRes] = await Promise.all([
        api.get('/requests/all', { params: filter !== 'all' ? { status: filter } : {} }),
        api.get('/requests/summary'),
      ]);
      setRequests(reqRes.data.requests);
      setSummary(sumRes.data);
    } catch {
      /* show empty state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const openReview = (request) => {
    setReviewing(request);
    setReviewForm({ status: request.status === 'pending' ? '' : request.status, adminNote: request.adminNote || '' });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.status) return;
    setBusy(true);
    try {
      await api.patch(`/requests/${reviewing._id}/review`, reviewForm);
      setReviewing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm text-forest-300 hover:underline">← Admin</Link>
          <h1 className="font-serif text-3xl md:text-4xl">Book Requests</h1>
          <p className="mt-1 text-sm text-cream-300/70">Review and manage student book requests</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Pending', value: summary.pending, color: 'text-amber-300' },
          { label: 'Approved', value: summary.approved, color: 'text-blue-300' },
          { label: 'Added', value: summary.added, color: 'text-forest-300' },
          { label: 'Rejected', value: summary.rejected, color: 'text-red-300' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`font-serif text-3xl ${s.color}`}>{s.value}</div>
            <div className="text-xs text-cream-300/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-cream-300/10">
        {['all', 'pending', 'approved', 'rejected', 'added'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'border-forest-300 text-forest-300'
                : 'border-transparent text-cream-300 hover:text-cream-100'
            }`}
          >
            {f}
            {f === 'pending' && summary.pending > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
                {summary.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="mt-6">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : requests.length === 0 ? (
          <p className="py-16 text-center text-cream-300/60">No requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg text-cream-100">{r.title}</h3>
                      <span className={`badge text-xs ${STATUS_STYLES[r.status]}`}>
                        {STATUS_ICONS[r.status]} {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-cream-300/70">by {r.author}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-cream-300/50">
                      {r.genre && <span>Genre: {r.genre}</span>}
                      {r.isbn && <span className="font-mono">ISBN: {r.isbn}</span>}
                    </div>
                    {r.description && (
                      <p className="mt-2 text-sm text-cream-300/70">{r.description}</p>
                    )}
                    {r.reason && (
                      <p className="mt-1 text-sm text-cream-300/60 italic">Reason: "{r.reason}"</p>
                    )}
                    {r.adminNote && (
                      <div className="mt-2 rounded-lg border border-cream-300/10 bg-navy-800/50 px-3 py-2">
                        <p className="text-xs text-cream-300/50">Your note:</p>
                        <p className="text-sm text-cream-200">{r.adminNote}</p>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-cream-300/40">
                      <span>
                        By: <span className="text-cream-300/70">{r.user?.name}</span> ({r.user?.email})
                      </span>
                      <span>Library ID: <span className="font-mono text-cream-300/70">{r.user?.libraryId}</span></span>
                      <span>Submitted: {formatDate(r.createdAt)}</span>
                      {r.reviewedAt && <span>Reviewed: {formatDate(r.reviewedAt)} by {r.reviewedBy}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => openReview(r)}
                    className="btn-ghost px-3 py-1 text-xs shrink-0"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setReviewing(null)}
        >
          <form onSubmit={submitReview} className="card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Review Request</h2>
              <button type="button" onClick={() => setReviewing(null)} className="text-cream-300 hover:text-cream-100">✕</button>
            </div>

            <div className="rounded-lg border border-cream-300/10 bg-navy-800/50 p-3">
              <p className="font-semibold text-cream-100">{reviewing.title}</p>
              <p className="text-sm text-cream-300/70">by {reviewing.author}</p>
              <p className="text-xs text-cream-300/50 mt-1">Requested by {reviewing.user?.name}</p>
            </div>

            <div>
              <label className="label">Update Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['approved', 'rejected', 'added'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewForm((f) => ({ ...f, status: s }))}
                    className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                      reviewForm.status === s
                        ? `${STATUS_STYLES[s]} border-current`
                        : 'border-cream-300/10 text-cream-300/50 hover:border-cream-300/30'
                    }`}
                  >
                    {STATUS_ICONS[s]} {s}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-cream-300/40">
                "Added" means the book has been added to the library catalogue.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="admin-note">
                Note to student <span className="text-cream-300/50 text-xs">(optional)</span>
              </label>
              <textarea
                id="admin-note"
                rows={3}
                className="input"
                value={reviewForm.adminNote}
                onChange={(e) => setReviewForm((f) => ({ ...f, adminNote: e.target.value }))}
                placeholder="e.g. We'll try to add this book next month..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReviewing(null)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy || !reviewForm.status}>
                {busy ? 'Saving…' : 'Save Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageRequests;
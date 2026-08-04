import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatDate } from '../utils/helpers.js';

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

const EMPTY_FORM = {
  title: '',
  author: '',
  isbn: '',
  genre: '',
  description: '',
  reason: '',
};

const BookRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ busy: false, err: '', success: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests/my-requests');
      setRequests(res.data.requests);
    } catch {
      /* show empty state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, err: '', success: '' });
    try {
      await api.post('/requests', form);
      setStatus({ busy: false, err: '', success: 'Request submitted successfully! The library admin will review it.' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setStatus({ busy: false, err: err.response?.data?.message || 'Failed to submit request', success: '' });
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel request');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/dashboard" className="text-sm text-forest-300 hover:underline">← Dashboard</Link>
          <h1 className="font-serif text-3xl md:text-4xl">Request a Book</h1>
          <p className="mt-1 text-sm text-cream-300/70">
            Can't find a book in our library? Submit a request and we'll try to add it!
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setStatus({ busy: false, err: '', success: '' }); }} className="btn-primary text-sm">
          + New Request
        </button>
      </div>

      {/* Success message */}
      {status.success && (
        <div className="mt-4 rounded-xl border border-forest-300/30 bg-forest-500/10 px-4 py-3 text-sm text-forest-300">
          ✅ {status.success}
        </div>
      )}

      {/* Request form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <form onSubmit={submit} className="card my-8 w-full max-w-lg space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Request a Book</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-cream-300 hover:text-cream-100">✕</button>
            </div>

            {status.err && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{status.err}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="req-title">Title <span className="text-red-400">*</span></label>
                <input id="req-title" className="input" value={form.title} onChange={field('title')} required placeholder="Book title" />
              </div>
              <div>
                <label className="label" htmlFor="req-author">Author <span className="text-red-400">*</span></label>
                <input id="req-author" className="input" value={form.author} onChange={field('author')} required placeholder="Author name" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="req-isbn">ISBN <span className="text-cream-300/50 text-xs">(optional)</span></label>
                <input id="req-isbn" className="input font-mono" value={form.isbn} onChange={field('isbn')} placeholder="e.g. 9780061996139" />
              </div>
              <div>
                <label className="label" htmlFor="req-genre">Genre <span className="text-cream-300/50 text-xs">(optional)</span></label>
                <input id="req-genre" className="input" value={form.genre} onChange={field('genre')} placeholder="e.g. Fiction, Science" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="req-desc">Book Description <span className="text-cream-300/50 text-xs">(optional)</span></label>
              <textarea id="req-desc" rows={2} className="input" value={form.description} onChange={field('description')} placeholder="Brief description of the book" />
            </div>

            <div>
              <label className="label" htmlFor="req-reason">Why do you want this book? <span className="text-cream-300/50 text-xs">(optional)</span></label>
              <textarea id="req-reason" rows={2} className="input" value={form.reason} onChange={field('reason')} placeholder="e.g. It's related to my coursework on..." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary" disabled={status.busy}>
                {status.busy ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests list */}
      <div className="mt-8">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📬</p>
            <p className="text-cream-300/60">You haven't made any book requests yet.</p>
            <button onClick={() => setShowForm(true)} className="btn-outline mt-4 text-sm">
              Make your first request
            </button>
          </div>
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
                    {r.genre && <p className="text-xs text-cream-300/50 mt-0.5">Genre: {r.genre}</p>}
                    {r.isbn && <p className="text-xs text-cream-300/50 font-mono">ISBN: {r.isbn}</p>}
                    {r.reason && (
                      <p className="mt-2 text-sm text-cream-300/70 italic">"{r.reason}"</p>
                    )}
                    {r.adminNote && (
                      <div className="mt-2 rounded-lg border border-cream-300/10 bg-navy-800/50 px-3 py-2">
                        <p className="text-xs text-cream-300/50">Admin note:</p>
                        <p className="text-sm text-cream-200">{r.adminNote}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-cream-300/40">
                      Submitted {formatDate(r.createdAt)}
                      {r.reviewedAt && ` · Reviewed ${formatDate(r.reviewedAt)}`}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => cancel(r._id)}
                      className="btn-danger px-3 py-1 text-xs shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookRequests;
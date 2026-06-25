import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookService from '../services/bookService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { resolveAsset } from '../utils/helpers.js';

/**
 * In-browser PDF reader. The PDF is rendered via an <iframe> using the
 * "#page=N" fragment to jump pages. Because an iframe can't report scroll
 * position back to us, the reader exposes explicit page controls and
 * autosaves the tracked page every 30 seconds (and on unmount).
 */
const BookReader = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [savedAt, setSavedAt] = useState(null);

  // Keep the latest page in a ref so the autosave interval reads fresh values.
  const pageRef = useRef(1);
  const lastSavedRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    let active = true;
    bookService
      .read(id)
      .then((res) => {
        if (!active) return;
        setData(res);
        setPage(res.currentPage || 1);
        pageRef.current = res.currentPage || 1;
        lastSavedRef.current = res.currentPage || 1;
      })
      .catch((err) =>
        active && setError(err.response?.data?.message || 'Unable to open this book')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  // Persist progress; skips the call when nothing changed.
  const saveProgress = async () => {
    if (pageRef.current === lastSavedRef.current) return;
    try {
      await bookService.saveProgress(id, pageRef.current);
      lastSavedRef.current = pageRef.current;
      setSavedAt(new Date());
    } catch {
      /* network hiccup — will retry on next tick */
    }
  };

  // Autosave loop + flush on unmount.
  useEffect(() => {
    if (!data) return undefined;
    const timer = setInterval(saveProgress, 30000);
    return () => {
      clearInterval(timer);
      saveProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, id]);

  if (loading) return <LoadingSpinner className="py-32" label="Opening book…" />;
  if (error)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-red-300">{error}</p>
        <Link to={`/books/${id}`} className="btn-outline mt-5">Back to book</Link>
      </div>
    );

  const totalPages = data.pageCount || 0;
  const clamp = (p) => Math.max(1, totalPages ? Math.min(totalPages, p) : p);
  const src = `${resolveAsset(data.pdfUrl)}#page=${page}&toolbar=1&view=FitH`;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col px-4 py-4">
      {/* Reader toolbar */}
      <div className="card mb-3 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <Link to={`/books/${id}`} className="text-xs text-forest-300 hover:underline">
            ← Back
          </Link>
          <h1 className="truncate font-serif text-lg">{data.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setPage((p) => clamp(p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>
          <label className="sr-only" htmlFor="page-input">Current page</label>
          <input
            id="page-input"
            type="number"
            min={1}
            max={totalPages || undefined}
            value={page}
            onChange={(e) => setPage(clamp(Number(e.target.value) || 1))}
            className="input w-20 px-2 py-1.5 text-center text-sm"
          />
          <span className="text-sm text-cream-300/60">
            {totalPages ? `/ ${totalPages}` : ''}
          </span>
          <button
            className="btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setPage((p) => clamp(p + 1))}
            disabled={totalPages ? page >= totalPages : false}
            aria-label="Next page"
          >
            ›
          </button>
          <button onClick={saveProgress} className="btn-outline px-3 py-1.5 text-sm">
            Save progress
          </button>
        </div>
      </div>

      {savedAt && (
        <p className="mb-2 text-right text-xs text-cream-300/50">
          Progress saved at {savedAt.toLocaleTimeString()}
        </p>
      )}

      {/* PDF viewer */}
      <div className="card flex-1 overflow-hidden">
        <iframe
          key={page} /* reload fragment so the page jump takes effect */
          src={src}
          title={`Reading: ${data.title}`}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};

export default BookReader;

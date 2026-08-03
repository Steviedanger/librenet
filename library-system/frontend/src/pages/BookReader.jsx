import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import bookService from '../services/bookService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { resolveAsset } from '../utils/helpers.js';

// Configure worker for PDF processing
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReader = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [scale, setScale] = useState(1.1);

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

  useEffect(() => {
    if (!data) return undefined;
    const timer = setInterval(saveProgress, 30000);
    return () => {
      clearInterval(timer);
      saveProgress();
    };
  }, [data, id]);

  if (loading) return <LoadingSpinner className="py-32" label="Opening book…" />;
  if (error)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-red-300">{error}</p>
        <Link to={`/books/${id}`} className="btn-outline mt-5">Back to book</Link>
      </div>
    );

  const totalPages = numPages || data.pageCount || 0;
  const clamp = (p) => Math.max(1, totalPages ? Math.min(totalPages, p) : p);

  return (
    <div 
      className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col px-4 py-4 select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Reader toolbar */}
      <div className="card mb-3 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <Link to={`/books/${id}`} className="text-xs text-forest-300 hover:underline">
            ← Back
          </Link>
          <h1 className="truncate font-serif text-lg">{data.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button 
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            className="btn-ghost px-2 py-1 text-xs"
            title="Zoom out"
          >
            -
          </button>
          <span className="text-xs text-cream-300/60">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale((s) => Math.min(1.8, s + 0.1))}
            className="btn-ghost px-2 py-1 text-xs"
            title="Zoom in"
          >
            +
          </button>

          <span className="mx-1 text-cream-300/30">|</span>

          {/* Page controls */}
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

      {/* Secure PDF Canvas Viewport */}
      <div className="card flex-1 overflow-auto flex justify-center items-start p-4 bg-gray-950">
        <Document
          file={resolveAsset(data.pdfUrl)}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="text-cream-300/60 py-12">Loading book securely…</div>}
          error={<div className="text-red-300 py-12">Failed to load readable file.</div>}
        >
          <Page
            pageNumber={page}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-2xl overflow-hidden rounded-sm"
          />
        </Document>
      </div>
    </div>
  );
};

export default BookReader;
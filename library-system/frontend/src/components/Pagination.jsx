/**
 * Accessible page navigation. Renders a compact window of page numbers with
 * ellipses for large ranges.
 */
const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const window = 1; // pages to show on each side of the current page

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const go = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) onChange(p);
  };

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-cream-300/40" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm transition-colors ${
              p === page
                ? 'bg-forest-400 font-semibold text-navy-900'
                : 'text-cream-300 hover:bg-navy-700'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next ›
      </button>
    </nav>
  );
};

export default Pagination;

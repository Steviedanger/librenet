// Base URL for assets served by the backend (covers, PDFs).
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

/**
 * Resolve a stored upload path (e.g. "/uploads/covers/x.jpg") or an absolute
 * URL to something the browser can load. Falls back to a placeholder.
 */
export const resolveAsset = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_ORIGIN}${pathOrUrl}`;
};

/** Human-readable date, e.g. "22 Jun 2026". */
export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Days until (positive) or since (negative) a due date. */
export const daysUntil = (value) => {
  if (!value) return 0;
  const ms = new Date(value).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/** Format a GHS currency amount, e.g. "GHS 4.50". */
export const formatGHS = (amount = 0) =>
  `GHS ${Number(amount || 0).toFixed(2)}`;

/** Generic debounce that preserves the latest call's arguments. */
export const debounce = (fn, wait = 400) => {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

/** Initials from a name, for avatar fallbacks. */
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/** Map a borrow status to badge classes. */
export const statusBadgeClass = (status) => {
  switch (status) {
    case 'active':
      return 'bg-forest-500/20 text-forest-300';
    case 'returned':
      return 'bg-cream-300/15 text-cream-300';
    case 'overdue':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-cream-300/15 text-cream-300';
  }
};

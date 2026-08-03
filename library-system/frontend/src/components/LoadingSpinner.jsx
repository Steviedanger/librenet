/**
 * Accessible loading indicator. `label` is announced to screen readers.
 */
const LoadingSpinner = ({ label = 'Loading…', className = '' }) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center gap-3 text-cream-300 ${className}`}
  >
    <span
      className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300/20 border-t-forest-300"
      aria-hidden="true"
    />
    <span className="text-sm">{label}</span>
  </div>
);

export default LoadingSpinner;

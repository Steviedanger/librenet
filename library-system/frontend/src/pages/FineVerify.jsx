import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatGHS } from '../utils/helpers.js';

const FineVerify = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  const [state, setState] = useState('loading'); // loading | success | failed
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setState('failed');
      setError('No payment reference found. Please try again.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/fines/verify-payment?reference=${reference}`);
        setDetails(res.data.record);
        setState('success');
      } catch (err) {
        setError(err.response?.data?.message || 'Payment verification failed. Please contact the library.');
        setState('failed');
      }
    };

    verify();
  }, [reference]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {state === 'loading' && (
        <div>
          <LoadingSpinner className="py-10" />
          <p className="mt-4 text-cream-300">Verifying your payment, please wait…</p>
        </div>
      )}

      {state === 'success' && (
        <div className="card p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-serif text-3xl text-forest-300">Payment Successful!</h1>
          <p className="mt-3 text-cream-300">
            Your fine of{' '}
            <span className="font-semibold text-cream-100">
              {formatGHS(details?.fineAmount || 0)}
            </span>{' '}
            has been cleared.
          </p>
          {details?.book?.title && (
            <p className="mt-2 text-sm text-cream-300/70">
              Book: <span className="text-cream-200">{details.book.title}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-cream-300/50 font-mono">
            Ref: {reference}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
            <Link to="/library" className="btn-outline">
              Browse Library
            </Link>
          </div>
        </div>
      )}

      {state === 'failed' && (
        <div className="card p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="font-serif text-3xl text-red-300">Payment Failed</h1>
          <p className="mt-3 text-cream-300">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs text-cream-300/50">
            If you were charged, please contact the library with reference:{' '}
            <span className="font-mono">{reference}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default FineVerify;
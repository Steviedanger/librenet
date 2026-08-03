import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '', message: '' });
  const ran = useRef(false); // guard against StrictMode double-invoke

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setState({ loading: false, error: 'Invalid verification link', message: '' });
      return;
    }

    authService
      .verifyEmail(token, email)
      .then((res) => setState({ loading: false, error: '', message: res.message }))
      .catch((err) =>
        setState({
          loading: false,
          error: err.response?.data?.message || 'Verification failed',
          message: '',
        })
      );
  }, [params]);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">Email verification</h1>
      <div className="card mt-6 p-8">
        {state.loading ? (
          <LoadingSpinner label="Verifying your email…" />
        ) : state.error ? (
          <>
            <p className="text-red-300">✕ {state.error}</p>
            <Link to="/register" className="btn-outline mt-5">Back to sign up</Link>
          </>
        ) : (
          <>
            <p className="text-forest-300">✓ {state.message}</p>
            <Link to="/login" className="btn-primary mt-5">Continue to login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

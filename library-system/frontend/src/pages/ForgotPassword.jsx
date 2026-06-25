import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService.js';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });
    try {
      const res = await authService.forgotPassword(email);
      setStatus({ loading: false, message: res.message, error: '' });
    } catch (err) {
      setStatus({
        loading: false,
        message: '',
        error: err.response?.data?.message || 'Something went wrong',
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-serif text-3xl">Reset your password</h1>
      <p className="mt-2 text-sm text-cream-300">
        Enter your email and we’ll send you a link to choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        {status.message && (
          <p className="rounded-lg bg-forest-500/15 px-3 py-2 text-sm text-forest-300">
            {status.message}
          </p>
        )}
        {status.error && (
          <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {status.error}
          </p>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={status.loading}>
          {status.loading ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-center text-sm text-cream-300">
          Remembered it?{' '}
          <Link to="/login" className="text-forest-300 hover:underline">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;

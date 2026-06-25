import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService.js';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const email = params.get('email');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [status, setStatus] = useState({ loading: false, error: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setStatus({ loading: false, error: 'Passwords do not match', message: '' });
    }
    setStatus({ loading: true, error: '', message: '' });
    try {
      const res = await authService.resetPassword({
        token,
        email,
        password: form.password,
      });
      setStatus({ loading: false, error: '', message: res.message });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || 'Reset failed',
        message: '',
      });
    }
  };

  if (!token || !email) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Invalid link</h1>
        <p className="mt-3 text-cream-300">This reset link is incomplete or expired.</p>
        <Link to="/forgot-password" className="btn-primary mt-5">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-serif text-3xl">Choose a new password</h1>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        {status.error && (
          <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {status.error}
          </p>
        )}
        {status.message && (
          <p className="rounded-lg bg-forest-500/15 px-3 py-2 text-sm text-forest-300">
            {status.message} Redirecting…
          </p>
        )}
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input id="password" type="password" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input id="confirm" type="password" className="input" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} required autoComplete="new-password" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={status.loading}>
          {status.loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

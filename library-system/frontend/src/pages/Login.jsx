import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      const user = await login(form);
      // Send admins to their console, students to where they were heading.
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || 'Login failed',
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-serif text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-cream-300">
        Log in to continue reading and managing your loans.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6" noValidate>
        {status.error && (
          <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {status.error}
          </p>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={update('email')} required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-xs text-forest-300 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" className="input" value={form.password} onChange={update('password')} required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={status.loading}>
          {status.loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-cream-300">
          New here?{' '}
          <Link to="/register" className="text-forest-300 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;

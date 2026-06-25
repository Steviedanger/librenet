import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [status, setStatus] = useState({ loading: false, error: '', registered: false });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: false, error: '', registered: false });

    if (form.password !== form.confirm) {
      return setStatus({ loading: false, error: 'Passwords do not match', registered: false });
    }
    if (form.password.length < 6) {
      return setStatus({ loading: false, error: 'Password must be at least 6 characters', registered: false });
    }

    setStatus({ loading: true, error: '', registered: false });
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setStatus({ loading: false, error: '', registered: true });
      setForm({ name: '', email: '', password: '', confirm: '' });
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || 'Registration failed',
        registered: false,
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-serif text-3xl">Join the Library</h1>
      <p className="mt-2 text-sm text-cream-300">
        Create your free reader account to borrow and read books online.
      </p>

      {status.registered ? (
        <div className="card mt-6 space-y-4 border-forest-300/30 p-6 text-center text-cream-200">
          <p className="font-serif text-xl text-forest-300">✓ Account created successfully!</p>
          <p className="text-sm text-cream-300">
            Kindly wait a few minutes for your account to be verified, then log
            back in. You'll be able to sign in once verification is complete.
          </p>
          <Link to="/login" className="btn-primary inline-block w-full">
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6" noValidate>
          {status.error && (
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
              {status.error}
            </p>
          )}
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" value={form.name} onChange={update('name')} required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={update('email')} required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password} onChange={update('password')} required autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" className="input" value={form.confirm} onChange={update('confirm')} required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={status.loading}>
            {status.loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-cream-300">
            Already a member?{' '}
            <Link to="/login" className="text-forest-300 hover:underline">Log in</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default Register;

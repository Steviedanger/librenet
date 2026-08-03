import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService.js';
import useAuth from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDate, initials } from '../../utils/helpers.js';

const ManageUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookService.users();
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (u) => {
    setBusyId(u._id);
    try {
      const { user: updated } = await bookService.setUserStatus(u._id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const verify = async (u) => {
    setBusyId(u._id);
    try {
      const { user: updated } = await bookService.verifyUser(u._id);
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const toggleRole = async (u) => {
    const nextRole = u.role === 'admin' ? 'student' : 'admin';
    setBusyId(u._id);
    try {
      const { user: updated } = await bookService.setUserRole(u._id, nextRole);
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.libraryId || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/admin" className="text-sm text-forest-300 hover:underline">← Admin</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl md:text-4xl">Manage users</h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or library ID…"
          aria-label="Search users"
          className="input max-w-xs"
        />
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-cream-300/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-cream-300/70">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-500 text-xs font-semibold text-navy-900">
                        {initials(u.name) || 'U'}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-cream-100">{u.name}</div>
                        <div className="truncate text-xs text-cream-300/70">{u.email}</div>
                        {u.role === 'student' && (
                          <div className="truncate font-mono text-xs text-forest-300">
                            {u.libraryId || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.role === 'admin' ? 'bg-forest-500/20 text-forest-300' : 'bg-navy-700 text-cream-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified ? (
                      <span className="text-forest-300">✓</span>
                    ) : (
                      <button
                        onClick={() => verify(u)}
                        className="btn-outline px-3 py-1 text-xs"
                        disabled={busyId === u._id}
                      >
                        {busyId === u._id ? '…' : 'Verify'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-cream-300">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? 'bg-forest-500/20 text-forest-300' : 'bg-red-500/20 text-red-300'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u._id === me?._id ? (
                      <span className="text-xs text-cream-300/50">You</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleRole(u)}
                          className="btn-outline px-3 py-1 text-xs"
                          disabled={busyId === u._id}
                        >
                          {busyId === u._id ? '…' : u.role === 'admin' ? 'Make student' : 'Make admin'}
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`px-3 py-1 text-xs ${u.isActive ? 'btn-danger' : 'btn-outline'}`}
                          disabled={busyId === u._id}
                        >
                          {busyId === u._id ? '…' : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-cream-300/60">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import bookService from '../services/bookService.js';
import { resolveAsset, initials } from '../utils/helpers.js';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(resolveAsset(user?.avatar));
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState({ busy: false, msg: '', err: '' });

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, msg: '', err: '' });

    const fd = new FormData();
    fd.append('name', name);
    if (avatar) fd.append('avatar', avatar);

    if (pw.next) {
      if (pw.next !== pw.confirm) {
        return setStatus({ busy: false, msg: '', err: 'New passwords do not match' });
      }
      fd.append('currentPassword', pw.current);
      fd.append('newPassword', pw.next);
    }

    try {
      const { user: updated } = await bookService.updateProfile(fd);
      updateUser(updated);
      setPw({ current: '', next: '', confirm: '' });
      setAvatar(null);
      setStatus({ busy: false, msg: 'Profile updated.', err: '' });
    } catch (err) {
      setStatus({
        busy: false,
        msg: '',
        err: err.response?.data?.message || 'Update failed',
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl md:text-4xl">Account settings</h1>
      <p className="mt-1 text-sm text-cream-300">{user?.email}</p>

      <form onSubmit={saveProfile} className="card mt-6 space-y-6 p-6">
        {(status.msg || status.err) && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${
              status.err ? 'bg-red-500/15 text-red-300' : 'bg-forest-500/15 text-forest-300'
            }`}
          >
            {status.err || status.msg}
          </p>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-500 text-lg font-semibold text-navy-900">
              {initials(name) || 'U'}
            </span>
          )}
          <div>
            <label className="label" htmlFor="avatar">Profile photo</label>
            <input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} className="text-sm text-cream-300" />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="label" htmlFor="name">Display name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        {/* Password change */}
        <fieldset className="space-y-4 border-t border-cream-300/10 pt-5">
          <legend className="font-serif text-lg text-cream-100">Change password</legend>
          <p className="text-xs text-cream-300/60">Leave blank to keep your current password.</p>
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input id="current" type="password" className="input" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="next">New password</label>
              <input id="next" type="password" className="input" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm new</label>
              <input id="confirm" type="password" className="input" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" />
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={status.busy}>
          {status.busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { resolveAsset, initials } from '../utils/helpers.js';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-forest-300' : 'text-cream-300 hover:text-cream-100'
  }`;

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300/10 bg-navy-900/90 backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">📖</span>
          <span className="font-serif text-xl font-bold text-cream-100">
            LibreNet
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/library" className={navLinkClass}>
            Library
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-cream-300/15 py-1 pl-1 pr-3 transition-colors hover:border-forest-300"
              >
                {user?.avatar ? (
                  <img
                    src={resolveAsset(user.avatar)}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-500 text-xs font-semibold text-navy-900">
                    {initials(user?.name) || 'U'}
                  </span>
                )}
                <span className="text-sm text-cream-200">
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Join the Library
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-cream-200 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="space-y-1 border-t border-cream-300/10 px-4 py-3 md:hidden">
          <NavLink to="/" className={navLinkClass} end onClick={() => setMenuOpen(false)}>
            <span className="block py-1">Home</span>
          </NavLink>
          <NavLink to="/library" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            <span className="block py-1">Library</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <span className="block py-1">Dashboard</span>
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/profile" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <span className="block py-1">Profile</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <span className="block py-1">Admin</span>
            </NavLink>
          )}
          <div className="pt-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-outline w-full text-sm">
                Logout
              </button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-outline flex-1 text-sm" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary flex-1 text-sm" onClick={() => setMenuOpen(false)}>
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

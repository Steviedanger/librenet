import { useEffect, useState, useRef } from 'react';
import notificationService from '../services/notificationService.js';
import useAuth from '../hooks/useAuth.js';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // refresh count every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const targetNotif = notifications.find((n) => n._id === id);
      if (targetNotif && !targetNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      /* ignore */
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-cream-200 hover:text-white transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-navy-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-cream-300/10 bg-navy-800 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-cream-300/10 px-4 py-3 bg-navy-900/50">
            <h3 className="font-medium text-cream-100 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-forest-300 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-cream-300/5">
            {loading ? (
              <div className="py-6 text-center text-xs text-cream-300/60">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-cream-300/60">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 transition-colors flex items-start justify-between gap-3 ${
                    item.read ? 'bg-transparent' : 'bg-navy-700/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                      )}
                      <h4 className="text-xs font-semibold text-cream-100">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-cream-300/80 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="block text-[10px] text-cream-300/40">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {!item.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        className="text-[10px] text-forest-300 hover:underline whitespace-nowrap"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      className="text-[10px] text-red-400/70 hover:text-red-400"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Notification } from '../../types';
import { useEffect } from 'react';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, accessToken, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    api
      .get<Notification[]>('/notifications', accessToken)
      .then(setNotifications)
      .catch(() => {});
  }, [accessToken]);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    if (!accessToken) return;
    await api.post('/notifications/read-all', {}, accessToken);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 border-t-[3px] border-t-brand-600 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="touch-target flex items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search modules, users, reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifs((v) => !v)}
            className="relative touch-target flex items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>

          {showNotifs ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
                aria-label="Close notifications"
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] slide-up rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="font-semibold text-slate-800">Notifications</span>
                  {unread > 0 ? (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications</li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`border-b border-slate-50 px-4 py-3 text-sm transition-colors ${!n.isRead ? 'bg-brand-50/50' : ''}`}
                      >
                        <p className="font-medium text-slate-800">{n.title}</p>
                        <p className="mt-0.5 text-slate-600">{n.message}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 touch-target"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-800">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold text-slate-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500">{user?.role.name}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => logout()}
          className="touch-target flex items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

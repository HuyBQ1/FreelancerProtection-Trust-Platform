import { Bell, BriefcaseBusiness, CheckCheck, ChevronDown, CreditCard, FileCheck2, LogOut, MessageSquareText, Settings, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

function formatNotificationTime(value) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationIcon(type) {
  if (type === 'message') return MessageSquareText;
  if (type === 'job_accepted') return BriefcaseBusiness;
  if (type === 'milestone_submitted' || type === 'milestone_approved') return FileCheck2;
  return Sparkles;
}

function Topbar({
  title,
  subtitle,
  onNavigate,
  onLogout,
  onOpenSettings,
  onOpenBankSettings,
  onNotificationOpen,
  language,
  onLanguageChange,
  copy,
  user,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);
  const displayName = user?.fullName?.trim() || user?.email || 'Guest User';
  const displayRole = user?.role || copy.role;
  const token = localStorage.getItem('fptp_token');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GU';

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Keep the topbar quiet if notifications cannot sync.
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, user?._id, user?.role]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('notification:new', ({ notification }) => {
      if (!notification) return;
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 30));
      setUnreadCount((current) => current + 1);
      setToastNotification(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!toastNotification) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToastNotification(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [toastNotification]);

  const markAllRead = async () => {
    if (!token) return;

    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);

    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      fetchNotifications();
    }
  };

  const openNotification = async (notification) => {
    setNotificationOpen(false);

    if (!notification.read) {
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));

      if (token) {
        fetch(`${API_BASE_URL}/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => fetchNotifications());
      }
    }

    onNotificationOpen?.(notification);
  };

  return (
    <header className="panel relative z-30 overflow-visible flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      {toastNotification ? (
        <button
          type="button"
          onClick={() => openNotification(toastNotification)}
          className="fixed right-5 top-5 z-[80] flex w-[360px] max-w-[calc(100vw-2.5rem)] gap-3 rounded-3xl border border-emerald-100 bg-white/95 p-4 text-left shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-200"
        >
          {(() => {
            const Icon = getNotificationIcon(toastNotification.type);
            return (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
            );
          })()}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-1 text-sm font-bold text-ink">{toastNotification.title}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                New
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{toastNotification.body || 'New workspace update.'}</p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">Click to open</p>
          </div>
        </button>
      ) : null}
      <div>
        <p className="muted">{subtitle}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{title}</h1>
      </div>

      <div className="relative z-30 flex items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => onLanguageChange('en')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${language === 'en' ? 'bg-ink text-white' : 'text-slate-600'}`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('vi')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${language === 'vi' ? 'bg-ink text-white' : 'text-slate-600'}`}
          >
            VI
          </button>
        </div>
        <div className="relative z-40">
          <button
            onClick={() => {
              setNotificationOpen((current) => !current);
              setMenuOpen(false);
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {notificationOpen ? (
            <div className="absolute right-0 top-full z-50 mt-3 w-[360px] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-3 px-2 py-2">
                <div>
                  <p className="text-sm font-bold text-ink">Notifications</p>
                  <p className="text-xs text-slate-500">{unreadCount} unread updates</p>
                </div>
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              </div>

              <div className="mt-2 max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);

                  return (
                    <button
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30 ${
                        notification.read ? 'border-slate-100 bg-white' : 'border-emerald-100 bg-emerald-50/50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        notification.read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold text-slate-900">{notification.title}</p>
                          {!notification.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.body || 'New workspace update.'}</p>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">{formatNotificationTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <Bell className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">No notifications yet</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Job accepts, submissions, approvals, and messages will appear here.</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative z-40">
          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition hover:border-slate-300 hover:bg-white"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="h-10 w-10 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine/10 font-bold text-pine">
                {initials}
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-xs capitalize text-slate-500">{displayRole}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="mt-1 text-xs text-slate-500">{user?.email || 'No email connected'}</p>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {displayRole}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenBankSettings?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <CreditCard className="h-4 w-4" />
                  Bank account setup
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    (onLogout || onNavigate)?.('landing');
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  {copy.logout}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Topbar;

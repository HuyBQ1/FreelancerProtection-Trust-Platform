import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  ChevronDown,
  FileCheck2,
  LogOut,
  MessageSquareText,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

function vi(text) {
  return text;
}

function formatNotificationTime(value, language) {
  if (!value) return language === 'vi' ? vi('\u0056\u1EEBa\u0020\u0078\u006F\u006E\u0067') : 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'vi' ? vi('\u0056\u1EEBa\u0020\u0078\u006F\u006E\u0067') : 'Just now';

  return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationIcon(type) {
  if (type === 'message') return MessageSquareText;
  if (type === 'job_accepted') return BriefcaseBusiness;
  if (type === 'milestone_submitted' || type === 'milestone_approved' || type === 'contract_signed') return FileCheck2;
  return Sparkles;
}

function translateNotificationTitle(notification, language) {
  if (language !== 'vi') return notification?.title || 'Notification';

  const title = `${notification?.title || ''}`.trim();
  const type = notification?.type;

  if (type === 'message' || title === 'New message' || title === 'New chat started') return vi('\u0054\u0069\u006E\u0020\u006E\u0068\u1EAF\u006E\u0020\u006D\u1EDBi');
  if (type === 'job_accepted' || title === 'Job accepted') return vi('\u0043\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063\u0020\u0111\u00E3\u0020\u0111\u01B0\u1EE3\u0063\u0020\u006E\u0068\u1EAD\u006E');
  if (title === 'Contract created') return vi('\u0048\u1EE3\u0070\u0020\u0111\u1ED3\u006E\u0067\u0020\u0111\u00E3\u0020\u0111\u01B0\u1EE3\u0063\u0020\u0074\u1EA1\u006F');
  if (title === 'Signature required') return 'Cần ký hợp đồng';
  if (title === 'Online contract created') return 'Đã tạo hợp đồng online';
  if (title === 'Online contract signed') return 'Hợp đồng online đã ký';
  if (type === 'milestone_submitted' || title === 'Submission sent' || title === 'Milestone submitted') return vi('\u0110\u00E3\u0020\u0067\u1EED\u0069\u0020\u0062\u00E0\u0069\u0020\u006E\u1ED9\u0070');
  if (type === 'milestone_approved' || title === 'Milestone approved') return vi('\u004D\u0069\u006C\u0065\u0073\u0074\u006F\u006E\u0065\u0020\u0111\u00E3\u0020\u0111\u01B0\u1EE3\u0063\u0020\u0064\u0075\u0079\u1EC7\u0074');
  if (title === 'Contract cancelled') return vi('\u0048\u1EE3\u0070\u0020\u0111\u1ED3\u006E\u0067\u0020\u0111\u00E3\u0020\u0062\u1ECB\u0020\u0068\u1EE7\u0079');

  return title || vi('\u0054\u0068\u00F4\u006E\u0067\u0020\u0062\u00E1\u006F');
}

function translateNotificationBody(notification, language) {
  const body = `${notification?.body || ''}`.trim();
  if (!body) {
    return language === 'vi'
      ? vi('\u0043\u00F3\u0020\u0063\u1EAD\u0070\u0020\u006E\u0068\u1EAD\u0074\u0020\u006D\u1EDBi\u0020\u0074\u0072\u006F\u006E\u0067\u0020\u006B\u0068\u00F4\u006E\u0067\u0020\u0067\u0069\u0061\u006E\u0020\u006C\u00E0\u006D\u0020\u0076\u0069\u1EC7\u0063\u002E')
      : 'New workspace update.';
  }

  if (language !== 'vi') return body;

  if (notification?.type === 'message') {
    const colonIndex = body.indexOf(':');
    if (colonIndex > 0) {
      const sender = body.slice(0, colonIndex).trim();
      const message = body.slice(colonIndex + 1).trim();
      return `${sender}: ${message}`;
    }

    if (body.includes('started a conversation about')) {
      const [senderPart, contractPart] = body.split('started a conversation about');
      const sender = senderPart?.trim();
      const contract = contractPart?.replace(/^"/, '').replace(/"\.?$/, '').trim();
      return `${sender} ${vi('\u0111\u00E3\u0020\u0062\u1EAF\u0074\u0020\u0111\u1EA7\u0075\u0020\u0063\u0075\u1ED9\u0063\u0020\u0074\u0072\u00F2\u0020\u0063\u0068\u0075\u0079\u1EC7\u006E\u0020\u0076\u1EC1')} "${contract}".`;
    }
  }

  if (body.startsWith('You submitted "')) {
    const match = body.match(/^You submitted "(.+)" for "(.+)"\.$/);
    if (match) {
      return `${vi('\u0042\u1EA1\u006E\u0020\u0111\u00E3\u0020\u0067\u1EED\u0069')} "${match[1]}" ${vi('\u0063\u0068\u006F\u0020\u0063\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[2]}".`;
    }
  }

  if (body.includes(' submitted "') && body.includes('" for "')) {
    const match = body.match(/^(.+?) submitted "(.+)" for "(.+)"\.$/);
    if (match) {
      return `${match[1]} ${vi('\u0111\u00E3\u0020\u0067\u1EED\u0069')} "${match[2]}" ${vi('\u0063\u0068\u006F\u0020\u0063\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[3]}".`;
    }
  }

  if (body.startsWith('"') && body.includes('" was approved and paid for "')) {
    const match = body.match(/^"(.+)" was approved and paid for "(.+)"\.$/);
    if (match) {
      return `"${match[1]}" ${vi('\u0111\u00E3\u0020\u0111\u01B0\u1EE3\u0063\u0020\u0064\u0075\u0079\u1EC7\u0074\u0020\u0076\u00E0\u0020\u0074\u0068\u0061\u006E\u0068\u0020\u0074\u006F\u00E1\u006E\u0020\u0063\u0068\u006F\u0020\u0063\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[2]}".`;
    }
  }

  if (body.includes(' accepted "') && body.includes('Pending escrow has been reserved')) {
    const match = body.match(/^(.+?) accepted "(.+)"\./);
    if (match) {
      return `${match[1]} ${vi('\u0111\u00E3\u0020\u006E\u0068\u1EAD\u006E\u0020\u0063\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[2]}".`;
    }
  }

  if (body.startsWith('You accepted "')) {
    const match = body.match(/^You accepted "(.+)"\./);
    if (match) {
      return `${vi('\u0042\u1EA1\u006E\u0020\u0111\u00E3\u0020\u006E\u0068\u1EAD\u006E\u0020\u0063\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[1]}". ${vi('\u0048\u1EE3\u0070\u0020\u0111\u1ED3\u006E\u0067\u0020\u0111\u00E3\u0020\u0073\u1EB5\u006E\u0020\u0073\u00E0\u006E\u0067\u0020\u0074\u0072\u006F\u006E\u0067\u0020\u006B\u0068\u00F4\u006E\u0067\u0020\u0067\u0069\u0061\u006E\u0020\u006C\u00E0\u006D\u0020\u0076\u0069\u1EC7\u0063\u002E')}`;
    }
  }

  if (body.includes('The online contract is waiting for freelancer signature.')) {
    const match = body.match(/^(.+?) accepted "(.+?)"\./);
    if (match) {
      return `${match[1]} đã được chọn cho "${match[2]}". Hợp đồng online đang chờ freelancer ký.`;
    }
    return 'Hợp đồng online đang chờ freelancer ký.';
  }

  if (body.startsWith('You must sign the online contract for "')) {
    const match = body.match(/^You must sign the online contract for "(.+?)" before starting work\.$/);
    if (match) {
      return `Bạn cần ký hợp đồng online cho "${match[1]}" trước khi bắt đầu làm việc.`;
    }
  }

  if (body.includes('Please sign the online contract before starting work.')) {
    const match = body.match(/^Your proposal for "(.+?)" was selected\./);
    if (match) {
      return `Đề xuất của bạn cho "${match[1]}" đã được chọn. Vui lòng ký hợp đồng online trước khi bắt đầu làm việc.`;
    }
  }

  if (body.includes('signed the online contract for')) {
    const match = body.match(/^(.+?) signed the online contract for "(.+?)"\./);
    if (match) {
      return `${match[1]} đã ký hợp đồng online cho "${match[2]}". Công việc có thể bắt đầu.`;
    }
  }

  if (body.startsWith('"') && body.includes('" was cancelled and returned to the marketplace.')) {
    const match = body.match(/^"(.+)" was cancelled and returned to the marketplace\.$/);
    if (match) {
      return `${vi('\u0043\u00F4\u006E\u0067\u0020\u0076\u0069\u1EC7\u0063')} "${match[1]}" ${vi('\u0111\u00E3\u0020\u0062\u1ECB\u0020\u0068\u1EE7\u0079\u0020\u0076\u00E0\u0020\u0111\u01B0\u1EE3\u0063\u0020\u0111\u01B0\u0061\u0020\u0074\u0072\u1EDF\u0020\u006C\u1EA1\u0069\u0020\u0074\u0068\u1ECB\u0020\u0074\u0072\u01B0\u1EDD\u006E\u0067\u002E')}`;
    }
  }

  return body;
}

function Topbar({
  title,
  subtitle,
  onNavigate,
  onLogout,
  onOpenSettings,
  onOpenBankSettings,
  onOpenKycSettings,
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
  const displayName = user?.fullName?.trim() || user?.email || (language === 'vi' ? vi('\u004E\u0067\u01B0\u1EDDi\u0020\u0064\u00F9\u006E\u0067') : 'Guest User');
  const displayRole = language === 'vi'
    ? (user?.role === 'client'
      ? vi('\u004B\u0068\u00E1\u0063\u0068\u0020\u0068\u00E0\u006E\u0067')
      : user?.role === 'freelancer'
        ? 'Freelancer'
        : user?.role === 'admin'
          ? vi('\u0051\u0075\u1EA3\u006E\u0020\u0074\u0072\u1ECB\u0020\u0076\u0069\u00EA\u006E')
          : copy.role)
    : (user?.role || copy.role);
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
      window.dispatchEvent(new CustomEvent('fptp:notification', { detail: notification }));
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
              <p className="line-clamp-1 text-sm font-bold text-ink">{translateNotificationTitle(toastNotification, language)}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                {language === 'vi' ? vi('\u004D\u1EDBi') : 'New'}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{translateNotificationBody(toastNotification, language)}</p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">{language === 'vi' ? vi('\u0042\u1EA5\u006D\u0020\u0111\u1EC3\u0020\u006D\u1EDF') : 'Click to open'}</p>
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
                  <p className="text-sm font-bold text-ink">{language === 'vi' ? vi('\u0054\u0068\u00F4\u006E\u0067\u0020\u0062\u00E1\u006F') : 'Notifications'}</p>
                  <p className="text-xs text-slate-500">{language === 'vi' ? `${unreadCount} ${vi('\u0063\u1EAD\u0070\u0020\u006E\u0068\u1EAD\u0074\u0020\u0063\u0068\u01B0\u0061\u0020\u0111\u1ECD\u0063')}` : `${unreadCount} unread updates`}</p>
                </div>
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {language === 'vi' ? vi('\u0110\u1ECD\u0063\u0020\u0074\u1EA5\u0074\u0020\u0063\u1EA3') : 'Read all'}
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
                          <p className="line-clamp-1 text-sm font-semibold text-slate-900">{translateNotificationTitle(notification, language)}</p>
                          {!notification.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{translateNotificationBody(notification, language)}</p>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">{formatNotificationTime(notification.createdAt, language)}</p>
                      </div>
                    </button>
                  );
                })}

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <Bell className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{language === 'vi' ? vi('\u0043\u0068\u01B0\u0061\u0020\u0063\u00F3\u0020\u0074\u0068\u00F4\u006E\u0067\u0020\u0062\u00E1\u006F\u0020\u006E\u00E0\u006F') : 'No notifications yet'}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{language === 'vi' ? vi('\u0054\u0068\u00F4\u006E\u0067\u0020\u0074\u0069\u006E\u0020\u006E\u0068\u1EAD\u006E\u0020\u006A\u006F\u0062\u002C\u0020\u0062\u00E0\u0069\u0020\u006E\u1ED9\u0070\u002C\u0020\u0070\u0068\u00EA\u0020\u0064\u0075\u0079\u1EC7\u0074\u0020\u0076\u00E0\u0020\u0074\u0069\u006E\u0020\u006E\u0068\u1EAF\u006E\u0020\u0073\u1EBD\u0020\u0078\u0075\u1EA5\u0074\u0020\u0068\u0069\u1EC7\u006E\u0020\u1EDF\u0020\u0111\u00E2\u0079\u002E') : 'Job accepts, submissions, approvals, and messages will appear here.'}</p>
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
                <p className="mt-1 text-xs text-slate-500">{user?.email || (language === 'vi' ? vi('\u0043\u0068\u01B0\u0061\u0020\u0063\u00F3\u0020\u0065\u006D\u0061\u0069\u006C\u0020\u006C\u0069\u00EA\u006E\u0020\u006B\u1EBF\u0074') : 'No email connected')}</p>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {displayRole}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {user?.role !== 'admin' ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenKycSettings?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {language === 'vi' ? 'Xác minh KYC' : 'KYC verification'}
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings className="h-4 w-4" />
                  {language === 'vi' ? vi('\u0043\u00E0\u0069\u0020\u0111\u1EB7\u0074') : 'Settings'}
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

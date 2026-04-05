import { Bell, LogOut } from 'lucide-react';

function Topbar({ title, subtitle, onNavigate, language, onLanguageChange, copy, user }) {
  const displayName = user?.fullName?.trim() || user?.email || 'Guest User';
  const displayRole = user?.role || copy.role;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GU';

  return (
    <header className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="muted">{subtitle}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
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
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-slate-900">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="h-10 w-10 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine/10 font-bold text-pine">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs capitalize text-slate-500">{displayRole}</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          {copy.logout}
        </button>
      </div>
    </header>
  );
}

export default Topbar;

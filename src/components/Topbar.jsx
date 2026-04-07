import { Bell, ChevronDown, CreditCard, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

function Topbar({
  title,
  subtitle,
  onNavigate,
  onLogout,
  onOpenSettings,
  onOpenBankSettings,
  language,
  onLanguageChange,
  copy,
  user,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user?.fullName?.trim() || user?.email || 'Guest User';
  const displayRole = user?.role || copy.role;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GU';

  return (
    <header className="panel relative z-30 overflow-visible flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-slate-900">
          <Bell className="h-5 w-5" />
        </button>
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

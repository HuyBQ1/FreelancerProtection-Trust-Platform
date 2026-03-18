import { Bell, LogOut } from 'lucide-react';

function Topbar({ title, subtitle, onNavigate, language, onLanguageChange, copy }) {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine/10 font-bold text-pine">
            AL
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Ariana Lee</p>
            <p className="truncate text-xs text-slate-500">{copy.role}</p>
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

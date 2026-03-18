import { ArrowRight, Shield } from 'lucide-react';

function Navbar({ onNavigate, copy, language, onLanguageChange }) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
      <button onClick={() => onNavigate('landing')} className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-soft">
          <Shield className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Freelancer</p>
          <p className="text-base font-bold tracking-tight text-ink">Protection & Trust</p>
        </div>
      </button>

      <nav className="hidden items-center gap-8 md:flex">
        <button onClick={() => onNavigate('landing')} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
          {copy.home}
        </button>
        <button onClick={() => onNavigate('marketplace')} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
          {copy.marketplace}
        </button>
        <button onClick={() => onNavigate('contracts')} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
          {copy.contracts}
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl border border-slate-300 bg-white p-1 sm:flex">
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
        <button
          onClick={() => onNavigate('dashboard')}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          {copy.login}
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {copy.register}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export default Navbar;

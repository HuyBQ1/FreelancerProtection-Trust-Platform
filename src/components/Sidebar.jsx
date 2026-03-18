import {
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Scale,
} from 'lucide-react';

const iconMap = {
  Dashboard: LayoutDashboard,
  Jobs: BriefcaseBusiness,
  Contracts: ClipboardList,
  Payments: CircleDollarSign,
  Disputes: Scale,
};

function Sidebar({ items, activePage, onNavigate, labels }) {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 lg:block">
      <div className="panel flex h-full flex-col p-5">
        <div className="rounded-3xl bg-ink p-5 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">{labels.workspace}</p>
          <h2 className="mt-3 text-xl font-bold">{labels.trustCenter}</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {labels.workspaceDesc}
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {items.map((item) => {
            const Icon = iconMap[item.label];
            const selected = activePage === item.page;

            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.page)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  selected
                    ? 'bg-pine text-white shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {labels[item.label] || item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">{labels.balanceProtected}</p>
          <p className="mt-2 text-3xl font-bold text-ink">$24,600</p>
          <p className="mt-2 text-sm text-slate-500">{labels.balanceDesc}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

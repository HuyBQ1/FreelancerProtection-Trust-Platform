import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  LockKeyhole,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import SectionCard from './SectionCard';

function PaymentCenter({
  mode = 'client',
  balance = 0,
  walletAmount,
  onWalletAmountChange,
  walletLoading,
  walletStatus,
  recentTransactions = [],
  formatMoney,
  formatTransactionTime,
  getTransactionLabel,
  getTransactionTone,
  onTopUp,
  onRelease,
  onWithdraw,
  onOpenBank,
}) {
  const isClient = mode === 'client';
  const title = isClient ? 'Client Payment Center' : 'Freelancer Payout Center';
  const eyebrow = isClient ? 'Workspace wallet' : 'Verified payouts';
  const trend = isClient ? '+12.4% vs last month' : '+8.1% vs last month';
  const note = isClient
    ? 'Use one shared balance for top-ups, milestone releases, invoices, and supplier payments.'
    : 'Approved milestone releases land here first, then you can withdraw to your linked bank account.';
  const historyTitle = isClient ? 'Payment history' : 'Payout history';

  const primaryActions = isClient
    ? [
        { label: 'Top Up', icon: Wallet, onClick: onTopUp, tone: 'primary' },
        { label: 'Release Payment', icon: Send, onClick: onRelease, tone: 'secondary' },
      ]
    : [
        { label: 'Withdraw Funds', icon: ArrowDownLeft, onClick: onWithdraw, tone: 'primary' },
        { label: 'Open Bank Account', icon: Landmark, onClick: onOpenBank, tone: 'secondary' },
      ];

  const smartActions = [
    { label: 'Send payment', icon: Send, hint: 'Move funds to an approved counterparty.' },
    { label: 'Milestone payout', icon: Banknote, hint: 'Prepare a release for approved work.' },
    { label: 'Request invoice', icon: Receipt, hint: 'Collect billing records for finance.' },
    { label: 'Payment method', icon: CreditCard, hint: 'Manage cards and bank rails.' },
  ];

  const chartBars = [42, 58, 52, 75, 68, 90];
  const distribution = [
    ['Design', '38%', 'bg-emerald-500'],
    ['Engineering', '34%', 'bg-sky-500'],
    ['Security', '18%', 'bg-indigo-500'],
    ['Other', '10%', 'bg-slate-300'],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="flex h-full flex-col gap-6">
          <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.2),transparent_30%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
              <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="relative">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                      {eyebrow}
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>
                    <p className="mt-4 text-6xl font-bold tracking-tight text-white">{formatMoney(balance)}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {trend}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-left lg:text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Security posture</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    Protected
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/55">Fraud monitoring, verified identities, and release controls are active.</p>
                </div>
              </div>

              <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)]">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                    <input
                      value={walletAmount}
                      onChange={(event) => onWalletAmountChange(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="Enter amount, for example 500"
                    />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {primaryActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={action.onClick}
                        disabled={walletLoading}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            action.tone === 'primary'
                              ? 'bg-[#00B386] text-white hover:bg-emerald-500'
                              : 'border border-white/12 bg-white text-[#0B1020] hover:bg-slate-100'
                          }`}
                        >
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Usage note</p>
                    <p className="mt-3 text-sm leading-7 text-white/70">{note}</p>
                  </div>
                </div>

                {walletStatus?.message ? (
                  <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${walletStatus.type === 'error' ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100'}`}>
                    {walletStatus.message}
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard className="border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">Smart actions</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Payment shortcuts</h2>
              </div>
              <div className="rounded-full bg-[#0B1020] px-3 py-1 text-xs font-semibold text-white">Recommended</div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {smartActions.map((action) => (
                <button key={action.label} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{action.hint}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">Analytics</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Cash flow overview</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFD] p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Monthly cash flow</p>
                    <p className="mt-1 text-xs text-slate-500">Rolling 6-month movement</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Healthy</span>
                </div>
                <div className="mt-6 flex h-40 items-end gap-3">
                  {chartBars.map((value, index) => (
                    <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-32 w-full items-end rounded-2xl bg-white/80 p-1">
                        <div
                          className={`w-full rounded-[14px] ${index === chartBars.length - 1 ? 'bg-gradient-to-t from-[#00B386] to-emerald-300' : 'bg-gradient-to-t from-slate-300 to-slate-200'}`}
                          style={{ height: `${value}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Distribution</p>
                <div className="mt-4 space-y-3">
                  {distribution.map(([label, value, color]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-semibold text-ink">{value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">Transactions</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{historyTitle}</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                {recentTransactions.length} items
              </span>
            </div>

            <div className="mt-6 flex max-h-[620px] min-h-[430px] flex-col rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest activity</p>
                  <p className="mt-2 text-lg font-semibold text-ink">Live ledger</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                  Updated now
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
                {recentTransactions.slice(0, 10).map((transaction, index) => {
                  const tone = getTransactionTone(transaction.type);
                  const isPositive = tone.sign === '+';
                  const CategoryIcon = isPositive ? ArrowUpRight : ArrowDownLeft;

                  return (
                    <div key={`${transaction._id || transaction.createdAt || index}`} className="group flex items-start gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(11,16,32,0.08)]">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.badge}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{getTransactionLabel(transaction.type)}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                            {isPositive ? 'Incoming' : 'Outgoing'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {transaction.description || 'Wallet transaction recorded.'}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tone.amount}`}>{tone.sign}{formatMoney(transaction.amount || 0)}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">Completed</p>
                      </div>
                    </div>
                  );
                })}

                {recentTransactions.length === 0 ? (
                  <div className="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center text-sm leading-6 text-slate-500">
                    No transaction history yet.
                  </div>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard className="border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">Operations</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Upcoming releases</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                ['Mobile App UI Design', '$1,600', 'Due today'],
                ['Brand Identity Package', '$900', 'Due May 10'],
                ['Dashboard QA Review', '$740', 'Due May 14'],
              ].map(([label, amount, due]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{due}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{amount}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Release controls active</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Upcoming payments stay protected until work is reviewed and the authorized party confirms release.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="px-2 pb-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment operations</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Ready for the next release</h2>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Protected payments', ShieldCheck, 'Release controls and audit trail enabled.'],
          ['Fraud protection', LockKeyhole, 'Risk checks run before sensitive movement.'],
          ['Verified records', FileText, 'Invoices and payout records stay attached.'],
        ].map(([label, Icon, hint]) => (
          <div key={label} className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">{label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentCenter;

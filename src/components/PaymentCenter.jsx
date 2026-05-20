import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  FileText,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import SectionCard from './SectionCard';
import { getStoredLanguage } from '../utils/language';

const PAYMENT_TELEGRAM_GROUP_URL = 'https://t.me/+GN6qjsRlEYA5Njc9';

function buildVietQrUrl({ bankCode, accountNumber, accountName, amount, transferContent }) {
  if (!bankCode || !accountNumber || !amount || !transferContent) {
    return '';
  }

  const query = new URLSearchParams({
    amount: `${Math.round(Number(amount) || 0)}`,
    addInfo: transferContent,
    accountName: accountName || '',
  });

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${query.toString()}`;
}

function PaymentCenter({
  mode = 'client',
  balance = 0,
  pendingBalance = 0,
  walletAmount,
  onWalletAmountChange,
  walletLoading,
  walletStatus,
  sepayPayment,
  recentTransactions = [],
  formatMoney,
  formatTransactionTime,
  getTransactionLabel,
  getTransactionTone,
  onTopUp,
  onRelease,
  onWithdraw,
}) {
  const isVietnamese = getStoredLanguage() === 'vi';
  const isClient = mode === 'client';
  const localTransactionLabel = (type) => {
    if (type === 'topup') return isVietnamese ? 'Nạp tiền' : 'Top Up';
    if (type === 'deposit') return isVietnamese ? 'Tạo ký quỹ' : 'Create Deposit';
    if (type === 'release') return isVietnamese ? 'Giải ngân' : 'Release Payment';
    if (type === 'withdrawal') return isVietnamese ? 'Rút tiền' : 'Withdrawal';
    return getTransactionLabel?.(type) || (isVietnamese ? 'Giao dịch' : 'Transaction');
  };
  const localTransactionDescription = (transaction) => {
    const description = transaction?.description || '';
    if (!description) return isVietnamese ? 'Đã ghi nhận giao dịch số dư.' : 'Wallet transaction recorded.';
    if (!isVietnamese) return description;
    if (description.includes('Withdrawal to linked bank account')) return 'Rút tiền về tài khoản ngân hàng đã liên kết';
    if (description.includes('Pending milestone payment for job:')) return description.replace('Pending milestone payment for job:', 'Thanh toán milestone đang chờ xử lý cho công việc:');
    if (description.includes('Milestone approved and paid for job:')) return description.replace('Milestone approved and paid for job:', 'Milestone đã được duyệt và thanh toán cho công việc:');
    if (description.includes('Wallet transaction recorded.')) return 'Đã ghi nhận giao dịch số dư.';
    if (description.includes('Top up')) return description.replace('Top up', 'Nạp tiền');
    if (description.includes('Release payment')) return description.replace('Release payment', 'Giải ngân');
    if (description.includes('Withdrawal')) return description.replace('Withdrawal', 'Rút tiền');
    return description;
  };
  const title = isVietnamese
    ? (isClient ? 'Trung tâm thanh toán khách hàng' : 'Trung tâm rút tiền freelancer')
    : (isClient ? 'Client Payment Center' : 'Freelancer Payout Center');
  const eyebrow = isVietnamese
    ? (isClient ? 'Ví trong không gian làm việc' : 'Rút tiền đã xác minh')
    : (isClient ? 'Workspace wallet' : 'Verified payouts');
  const trend = isClient ? '+12.4% vs last month' : '+8.1% vs last month';
  const historyTitle = isVietnamese
    ? (isClient ? 'Lịch sử thanh toán' : 'Lịch sử rút tiền')
    : (isClient ? 'Payment history' : 'Payout history');
  const pendingLabel = isVietnamese
    ? (isClient ? 'Khoản chờ xử lý' : 'Khoản chờ rút')
    : (isClient ? 'Pending escrow' : 'Pending payouts');
  const pendingHint = isClient
    ? (isVietnamese ? 'Được giữ cho các công việc đã nhận cho tới khi milestone được duyệt.' : 'Reserved for accepted jobs until milestone approval.')
    : (isVietnamese ? 'Công việc đã được duyệt sẽ chuyển từ chờ xử lý sang số dư khả dụng.' : 'Approved work will move from pending to available balance.');
  const pendingSepayTransaction = recentTransactions.find(
    (transaction) => transaction?.paymentProvider === 'sepay' && transaction?.status === 'pending',
  );
  const pendingSepayMetadata = pendingSepayTransaction?.paymentMetadata || {};
  const pendingSepayTransferContent = pendingSepayMetadata.transferContent || pendingSepayTransaction?.paymentCode || '';
  const pendingSepayAmount = pendingSepayTransaction?.amount || 0;
  const sepayInfo = sepayPayment || (pendingSepayTransaction ? {
    provider: 'sepay',
    amount: pendingSepayAmount,
    amountLabel: formatMoney(pendingSepayAmount),
    paymentCode: pendingSepayTransaction.paymentCode || '',
    bankCode: pendingSepayMetadata.bankCode || '',
    bankName: pendingSepayMetadata.bankName || '',
    accountNumber: pendingSepayMetadata.accountNumber || '',
    accountName: pendingSepayMetadata.accountName || '',
    transferContent: pendingSepayTransferContent,
    qrUrl: pendingSepayMetadata.qrUrl || buildVietQrUrl({
      bankCode: pendingSepayMetadata.bankCode,
      accountNumber: pendingSepayMetadata.accountNumber,
      accountName: pendingSepayMetadata.accountName,
      amount: pendingSepayAmount,
      transferContent: pendingSepayTransferContent,
    }),
  } : null);

  const primaryActions = isClient
    ? [
        { label: isVietnamese ? 'Nạp tiền' : 'Top Up', icon: Wallet, onClick: onTopUp, tone: 'primary' },
        { label: isVietnamese ? 'Rút tiền' : 'Withdraw Funds', icon: ArrowDownLeft, onClick: onWithdraw, tone: 'secondary' },
      ]
    : [
        { label: isVietnamese ? 'Nạp tiền' : 'Top Up', icon: Wallet, onClick: onTopUp, tone: 'primary' },
        { label: isVietnamese ? 'Rút tiền' : 'Withdraw Funds', icon: ArrowDownLeft, onClick: onWithdraw, tone: 'secondary' },
      ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] 2xl:items-start">
        <div className="flex flex-col gap-6">
          <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.2),transparent_30%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
              <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="relative">
              <div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                      {eyebrow}
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>
                    <p className="mt-4 break-words text-4xl font-bold tracking-tight text-white sm:text-5xl 2xl:text-6xl">{formatMoney(balance)}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {trend}
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                    <input
                      value={walletAmount}
                      onChange={(event) => onWalletAmountChange(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder={isVietnamese ? 'Nhập số tiền, ví dụ 500000' : 'Enter amount, for example 500000'}
                    />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {primaryActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={action.onClick}
                        disabled={walletLoading}
                        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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

                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{pendingLabel}</p>
                    <p className="mt-3 text-4xl font-bold text-white">{formatMoney(pendingBalance)}</p>
                    <p className="mt-3 text-xs leading-5 text-white/55">{pendingHint}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                      <Clock3 className="h-3.5 w-3.5" />
                      {isVietnamese ? 'Chờ xử lý' : 'Pending'}
                    </div>
                  </div>

                </div>

                <a
                  href={PAYMENT_TELEGRAM_GROUP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-4 rounded-[22px] border border-sky-300/25 bg-sky-400/10 p-4 text-white transition hover:border-sky-300/45 hover:bg-sky-400/15"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400 text-white shadow-lg shadow-sky-950/20">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">Bot nhận thông tin thanh toán</p>
                    <p className="mt-1 text-xs leading-5 text-white/60">Telegram group</p>
                  </div>
                </a>

                {walletStatus?.message && walletStatus.type === 'error' ? (
                  <p className="mt-4 rounded-2xl bg-rose-400/15 px-4 py-3 text-sm text-rose-100">
                    {walletStatus.message}
                  </p>
                ) : null}

              </div>
            </div>
          </SectionCard>

        </div>

        <div className="flex flex-col">
          <SectionCard className="flex flex-col border border-white/70 bg-white/70 p-5 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl sm:p-6 2xl:h-[590px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">{isVietnamese ? 'Giao dịch' : 'Transactions'}</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{historyTitle}</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                {recentTransactions.length} {isVietnamese ? 'mục' : 'items'}
              </span>
            </div>

            <div className="mt-6 flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{isVietnamese ? 'Hoạt động mới nhất' : 'Latest activity'}</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{isVietnamese ? 'Sổ giao dịch trực tiếp' : 'Live ledger'}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                  {isVietnamese ? 'Vừa cập nhật' : 'Updated now'}
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
                          <span className="text-sm font-semibold text-ink">{localTransactionLabel(transaction.type)}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                            {isPositive ? (isVietnamese ? 'Vào' : 'Incoming') : (isVietnamese ? 'Ra' : 'Outgoing')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {localTransactionDescription(transaction)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tone.amount}`}>{tone.sign}{formatMoney(transaction.amount || 0)}</p>
                        <p className={`mt-2 text-[11px] uppercase tracking-[0.16em] ${transaction.status === 'pending' ? 'text-amber-500' : 'text-slate-400'}`}>
                          {transaction.status === 'pending' ? (isVietnamese ? 'Chờ xử lý' : 'Pending') : (isVietnamese ? 'Hoàn tất' : 'Completed')}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {recentTransactions.length === 0 ? (
                  <div className="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center text-sm leading-6 text-slate-500">
                      {isVietnamese ? 'Chưa có lịch sử giao dịch.' : 'No transaction history yet.'}
                  </div>
                ) : null}
              </div>
            </div>
          </SectionCard>

        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [isVietnamese ? 'Thanh toán được bảo vệ' : 'Protected payments', ShieldCheck, isVietnamese ? 'Kiểm soát giải ngân và nhật ký kiểm tra đang được bật.' : 'Release controls and audit trail enabled.'],
          [isVietnamese ? 'Chống gian lận' : 'Fraud protection', LockKeyhole, isVietnamese ? 'Kiểm tra rủi ro được chạy trước các thao tác nhạy cảm.' : 'Risk checks run before sensitive movement.'],
          [isVietnamese ? 'Hồ sơ đã xác minh' : 'Verified records', FileText, isVietnamese ? 'Hóa đơn và lịch sử rút tiền luôn được đính kèm.' : 'Invoices and payout records stay attached.'],
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


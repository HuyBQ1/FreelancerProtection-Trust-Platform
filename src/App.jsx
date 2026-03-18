import { useState } from 'react';
import { ChevronRight, CircleCheckBig, Clock3, Eye, HandCoins, Hourglass, Landmark, Scale, Search, Shield, ShieldCheck, Star, Upload, UserRound, Wallet } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatCard from './components/StatCard';
import SectionCard from './components/SectionCard';
import JobCard from './components/JobCard';
import StatusBadge from './components/StatusBadge';
import { activities, contracts, escrowSummary, jobs, sidebarItems, stats } from './data/mockData';

const featureIcons = [Landmark, ShieldCheck, Star];
const tx = {
  en: {
    nav: { home: 'Home', marketplace: 'Marketplace', contracts: 'Contracts', login: 'Login', register: 'Register' },
    top: { subtitle: 'Freelancer Protection & Trust Platform', role: 'Senior Product Freelancer', logout: 'Logout', titles: { landing: 'Landing', dashboard: 'Dashboard', marketplace: 'Job Marketplace', contracts: 'Contracts', escrow: 'Escrow Payments' } },
    sidebar: { Dashboard: 'Dashboard', Jobs: 'Jobs', Contracts: 'Contracts', Payments: 'Payments', Disputes: 'Disputes', workspace: 'Workspace', trustCenter: 'Trust Center', workspaceDesc: 'Secure jobs, contracts, payments, and dispute handling in one place.', balanceProtected: 'Balance protected', balanceDesc: 'Held across 8 active escrow contracts.' },
    landing: { chip: 'Trusted freelance commerce', title: 'Protect every freelance deal with transparent trust and escrow-first workflows.', desc: 'Freelancer Protection & Trust Platform helps clients and talent manage jobs, contracts, payments, and disputes in one secure place built for modern remote work.', a: 'Enter Dashboard', b: 'Explore Jobs', stats: [['12k+', 'Secured contracts'], ['$4.8M', 'Protected in escrow'], ['96%', 'Successful approvals']], health: 'Live contract health', healthTitle: 'Website redesign escrow', funds: 'Funds in protection', milestone: 'Milestone 3 of 4', security: 'Security layer', securityDesc: 'Identity, activity, and payout checks active', dispute: 'Dispute readiness', disputeDesc: 'Documented approvals and milestone evidence', features: 'Core Platform', featuresTitle: 'Everything needed to turn freelance risk into structured trust.', featuresDesc: 'Designed for marketplaces, agencies, and independent professionals who need payment security without friction.', footerContracts: 'Contracts', footerEscrow: 'Escrow' },
    featureList: [['Smart Escrow', 'Hold funds securely until approved milestones are delivered with confidence.'], ['Verified Security', 'Protect payments, files, and communication with built-in safeguards.'], ['Trust Signals', 'Make better hiring decisions with transparent reputation and dispute history.']],
    c: { pages: { landing: 'Landing', dashboard: 'Dashboard', marketplace: 'Marketplace', contracts: 'Contracts', escrow: 'Escrow' }, perf: 'Performance snapshot', recent: 'Recent activities', openContracts: 'Open contracts', protection: 'Protection status', safety: 'Account safety', identity: 'Identity verified', escrowCoverage: 'Escrow coverage', disputeSla: 'Dispute response SLA', reserve: 'Payout reserve', reserveDesc: 'Available after final milestone approval and release from escrow.', marketLabel: 'Job marketplace', marketTitle: 'Find protected opportunities', search: 'Search jobs or clients', budget: 'Budget', client: 'Client', noJobs: 'No jobs match your search or current filter.', contracts: 'Contracts', contractsTotal: 'contracts total', totalBudget: 'Total Budget', earned: 'Earned', startDate: 'Start Date', endDate: 'End Date', progress: 'Progress', milestonesComplete: 'milestones complete', milestones: 'Milestones', due: 'Due', approve: 'Approve', submit: 'Submit Work', escrowPayment: 'Escrow payment', protectedBalance: 'Protected balance overview', depositedAmount: 'Deposited amount', status: 'Status', release: 'Release Payment', dispute: 'Open Dispute', escrowTimeline: 'Escrow timeline', currentFundState: 'Current fund state', filters: { All: 'All', Design: 'Design', Development: 'Development', Security: 'Security', Legal: 'Legal' } },
    s: { Active: 'Active', Completed: 'Completed', Approved: 'Approved', Pending: 'Pending', Held: 'Held', Released: 'Released', 'In Progress': 'In Progress' },
  },
  vi: {
    nav: { home: 'Trang chủ', marketplace: 'Chợ việc làm', contracts: 'Hợp đồng', login: 'Đăng nhập', register: 'Đăng ký' },
    top: { subtitle: 'Nen tang bao ve va uy tin cho freelancer', role: 'Freelancer san pham cap cao', logout: 'Dang xuat', titles: { landing: 'Trang chu', dashboard: 'Tong quan', marketplace: 'Cho viec lam', contracts: 'Hop dong', escrow: 'Thanh toan ky quy' } },
    top: { subtitle: 'Nền tảng bảo vệ và uy tín cho freelancer', role: 'Freelancer sản phẩm cấp cao', logout: 'Đăng xuất', titles: { landing: 'Trang chủ', dashboard: 'Tổng quan', marketplace: 'Chợ việc làm', contracts: 'Hợp đồng', escrow: 'Thanh toán ký quỹ' } },
    sidebar: { Dashboard: 'Tổng quan', Jobs: 'Công việc', Contracts: 'Hợp đồng', Payments: 'Thanh toán', Disputes: 'Tranh chấp', workspace: 'Không gian làm việc', trustCenter: 'Trung tâm uy tín', workspaceDesc: 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.', balanceProtected: 'Số dư được bảo vệ', balanceDesc: 'Đang được giữ trong 8 hợp đồng escrow hoạt động.' },
    landing: { chip: 'Giao dịch freelance đáng tin cậy', title: 'Bảo vệ mọi thỏa thuận freelance bằng quy trình escrow và hệ thống uy tín minh bạch.', desc: 'Freelancer Protection & Trust Platform giúp khách hàng và freelancer quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi an toàn và hiện đại.', a: 'Vào dashboard', b: 'Khám phá công việc', stats: [['12k+', 'Hợp đồng được bảo vệ'], ['$4.8M', 'Được giữ an toàn trong escrow'], ['96%', 'Phê duyệt thành công']], health: 'Tình trạng hợp đồng trực tiếp', healthTitle: 'Escrow cho dự án thiết kế website', funds: 'Số tiền đang được bảo vệ', milestone: 'Milestone 3 trên 4', security: 'Lớp bảo mật', securityDesc: 'Xác thực danh tính, hoạt động và kiểm tra thanh toán đang hoạt động', dispute: 'Sẵn sàng xử lý tranh chấp', disputeDesc: 'Lưu vết phê duyệt và bằng chứng milestone đầy đủ', features: 'Nền tảng cốt lõi', featuresTitle: 'Mọi thứ bạn cần để biến rủi ro freelance thành hệ thống uy tín rõ ràng.', featuresDesc: 'Được thiết kế cho marketplace, agency và freelancer độc lập cần bảo vệ thanh toán mà vẫn giữ trải nghiệm gọn gàng.', footerContracts: 'Hợp đồng', footerEscrow: 'Ký quỹ' },
    featureList: [['Escrow thông minh', 'Giữ tiền an toàn cho đến khi milestone được bàn giao và phê duyệt.'], ['Bảo mật xác thực', 'Bảo vệ thanh toán, tệp tin và giao tiếp bằng các lớp kiểm tra tích hợp.'], ['Tín hiệu uy tín', 'Ra quyết định tốt hơn nhờ lịch sử uy tín và tranh chấp minh bạch.']],
    c: { pages: { landing: 'Trang chủ', dashboard: 'Tổng quan', marketplace: 'Chợ việc làm', contracts: 'Hợp đồng', escrow: 'Ký quỹ' }, perf: 'Tổng quan hiệu suất', recent: 'Hoạt động gần đây', openContracts: 'Mở hợp đồng', protection: 'Trạng thái bảo vệ', safety: 'Mức độ an toàn tài khoản', identity: 'Đã xác minh danh tính', escrowCoverage: 'Bảo vệ escrow', disputeSla: 'SLA xử lý tranh chấp', reserve: 'Số tiền chờ giải ngân', reserveDesc: 'Có thể nhận sau khi milestone cuối được phê duyệt và giải phóng từ escrow.', marketLabel: 'Chợ việc làm', marketTitle: 'Tìm cơ hội được bảo vệ', search: 'Tìm công việc hoặc khách hàng', budget: 'Ngân sách', client: 'Khách hàng', noJobs: 'Không có công việc phù hợp với tìm kiếm hoặc bộ lọc hiện tại.', contracts: 'Hợp đồng', contractsTotal: 'hợp đồng', totalBudget: 'Tổng ngân sách', earned: 'Đã nhận', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', progress: 'Tiến độ', milestonesComplete: 'milestone hoàn thành', milestones: 'Milestones', due: 'Hạn', approve: 'Phê duyệt', submit: 'Nộp bài làm', escrowPayment: 'Thanh toán ký quỹ', protectedBalance: 'Tổng quan số dư được bảo vệ', depositedAmount: 'Số tiền đã nạp', status: 'Trạng thái', release: 'Giải phóng thanh toán', dispute: 'Mở tranh chấp', escrowTimeline: 'Tiến trình escrow', currentFundState: 'Trạng thái hiện tại của quỹ', filters: { All: 'Tất cả', Design: 'Thiết kế', Development: 'Phát triển', Security: 'Bảo mật', Legal: 'Pháp lý' } },
    s: { Active: 'Đang hoạt động', Completed: 'Hoàn thành', Approved: 'Đã phê duyệt', Pending: 'Đang chờ', Held: 'Đang giữ', Released: 'Đã giải phóng', 'In Progress': 'Đang thực hiện' },
  },
};

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [language, setLanguage] = useState('vi');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id ?? null);

  const t = tx[language];
  const text = (value) => (typeof value === 'string' ? value : value?.[language] ?? value?.en ?? '');
  const statusText = (value) => t.s[value] ?? value;
  const selectedContract = contracts.find((item) => item.id === selectedContractId) ?? contracts[0];
  const pages = ['landing', 'dashboard', 'marketplace', 'contracts', 'escrow'];
  const filters = ['All', 'Design', 'Development', 'Security', 'Legal'];

  const filteredJobs = jobs.filter((job) => {
    const q = query.toLowerCase();
    return (
      (text(job.title).toLowerCase().includes(q) || job.client.toLowerCase().includes(q)) &&
      (selectedFilter === 'All' || text(job.category) === selectedFilter)
    );
  });

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={t.sidebar} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar title={t.top.titles[activePage]} subtitle={t.top.subtitle} onNavigate={setActivePage} language={language} onLanguageChange={setLanguage} copy={{ role: t.top.role, logout: t.top.logout }} />
          <div className="flex flex-wrap gap-2">
            {pages.map((page) => (
              <button key={page} onClick={() => setActivePage(page)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activePage === page ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}>
                {t.c.pages[page]}
              </button>
            ))}
          </div>
          {content}
        </div>
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid-fade bg-[size:100%_100%,44px_44px,44px_44px]" />
      <Navbar onNavigate={setActivePage} copy={t.nav} language={language} onLanguageChange={setLanguage} />
      <main className="mx-auto flex max-w-7xl flex-col gap-20 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="space-y-7">
            <span className="chip border-pine/20 bg-pine/10 text-pine">{t.landing.chip}</span>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">{t.landing.title}</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">{t.landing.desc}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setActivePage('dashboard')} className="inline-flex items-center justify-center rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{t.landing.a}</button>
              <button onClick={() => setActivePage('marketplace')} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">{t.landing.b}</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {t.landing.stats.map(([value, label]) => (
                <div key={label} className="panel p-5">
                  <p className="text-2xl font-bold text-ink">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-x-8 top-0 h-40 rounded-b-full bg-skyglass blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="muted">{t.landing.health}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{t.landing.healthTitle}</h2>
                </div>
                <StatusBadge status="Approved" label={statusText('Approved')} />
              </div>
              <div className="rounded-3xl bg-ink p-6 text-white">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{t.landing.funds}</span>
                  <span>{t.landing.milestone}</span>
                </div>
                <p className="mt-4 text-4xl font-bold">$8,400</p>
                <div className="mt-6 h-2 rounded-full bg-white/15"><div className="h-2 w-3/4 rounded-full bg-emerald-300" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="muted">{t.landing.security}</p>
                  <p className="mt-3 flex items-center gap-2 text-base font-semibold text-slate-900"><ShieldCheck className="h-5 w-5 text-pine" />{t.landing.securityDesc}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="muted">{t.landing.dispute}</p>
                  <p className="mt-3 flex items-center gap-2 text-base font-semibold text-slate-900"><Scale className="h-5 w-5 text-coral" />{t.landing.disputeDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="chip">{t.landing.features}</span>
            <h2 className="section-title">{t.landing.featuresTitle}</h2>
            <p className="text-slate-600">{t.landing.featuresDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featureIcons.map((Icon, index) => (
              <SectionCard key={index} className="p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine/10 text-pine"><Icon className="h-6 w-6" /></div>
                <h3 className="mt-6 text-xl font-semibold text-ink">{t.featureList[index][0]}</h3>
                <p className="mt-3 leading-7 text-slate-600">{t.featureList[index][1]}</p>
              </SectionCard>
            ))}
          </div>
        </section>
        <footer className="flex flex-col gap-4 border-t border-slate-200 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Freelancer Protection & Trust Platform</p>
          <div className="flex gap-4">
            <button onClick={() => setActivePage('contracts')} className="transition hover:text-slate-900">{t.landing.footerContracts}</button>
            <button onClick={() => setActivePage('escrow')} className="transition hover:text-slate-900">{t.landing.footerEscrow}</button>
          </div>
        </footer>
      </main>
    </div>
  );

  const renderDashboard = () => dashboardLayout(
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => <StatCard key={text(stat.label)} {...stat} label={text(stat.label)} hint={text(stat.hint)} />)}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="p-6">
          <div className="flex items-center justify-between">
            <div><p className="muted">{t.c.perf}</p><h2 className="mt-1 text-xl font-bold text-ink">{t.c.recent}</h2></div>
            <button onClick={() => setActivePage('contracts')} className="text-sm font-semibold text-pine transition hover:text-emerald-800">{t.c.openContracts}</button>
          </div>
          <div className="mt-6 space-y-4">
            {activities.map((activity) => (
              <div key={text(activity.title)} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div>
                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-slate-900">{text(activity.title)}</h3>
                    <span className="text-sm text-slate-400">{text(activity.time)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text(activity.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard className="p-6">
          <div className="flex items-center justify-between">
            <div><p className="muted">{t.c.protection}</p><h2 className="mt-1 text-xl font-bold text-ink">{t.c.safety}</h2></div>
            <ShieldCheck className="h-5 w-5 text-pine" />
          </div>
          <div className="mt-6 space-y-4">
            {[[t.c.identity, statusText('Approved')], [t.c.escrowCoverage, statusText('Active')], [t.c.disputeSla, '24 hours']].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-ink p-5 text-white">
            <p className="text-sm text-white/70">{t.c.reserve}</p>
            <p className="mt-2 text-3xl font-bold">$18,900</p>
            <p className="mt-3 text-sm leading-6 text-white/70">{t.c.reserveDesc}</p>
          </div>
        </SectionCard>
      </section>
    </div>
  );

  const renderMarketplace = () => dashboardLayout(
    <div className="space-y-6">
      <SectionCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="muted">{t.c.marketLabel}</p><h2 className="mt-1 text-xl font-bold text-ink">{t.c.marketTitle}</h2></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.c.search} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-60" />
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button key={filter} onClick={() => setSelectedFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFilter === filter ? 'bg-pine text-white' : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}>
                  {t.c.filters[filter]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
      <div className="grid gap-5 xl:grid-cols-2">
        {filteredJobs.length ? filteredJobs.map((job) => <JobCard key={text(job.title)} job={{ ...job, title: text(job.title), category: text(job.category), description: text(job.description) }} labels={{ budget: t.c.budget, client: t.c.client }} />) : <SectionCard className="p-6 text-slate-500 xl:col-span-2">{t.c.noJobs}</SectionCard>}
      </div>
    </div>
  );

  const renderContracts = () => dashboardLayout(
    <div className="space-y-6">
      <div><h2 className="text-3xl font-bold tracking-tight text-ink">{t.c.contracts}</h2><p className="mt-2 text-sm text-slate-500">{contracts.length} {t.c.contractsTotal}</p></div>
      <div className="grid gap-6 2xl:grid-cols-[520px_minmax(0,1fr)]">
        <div className="space-y-4">
          {contracts.map((contract) => {
            const isSelected = contract.id === selectedContract.id;
            return (
              <button key={contract.id} onClick={() => setSelectedContractId(contract.id)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">{contract.initials}</div>
                    <div><p className="text-xl font-semibold tracking-tight text-ink">{text(contract.title)}</p><p className="mt-1 text-sm text-slate-500">{contract.client}</p></div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${contract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{statusText(contract.status)}</span>
                </div>
                <p className="mt-5 text-2xl font-bold tracking-tight text-ink">{contract.budget}</p>
              </button>
            );
          })}
        </div>
        <div className="space-y-5">
          <SectionCard className="rounded-[28px] border border-slate-200 p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><h3 className="text-2xl font-bold tracking-tight text-ink">{text(selectedContract.title)}</h3><p className="mt-2 flex items-center gap-2 text-base text-slate-500"><UserRound className="h-4 w-4" />{selectedContract.client}</p></div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${selectedContract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{statusText(selectedContract.status)}</span>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-sm text-slate-500">{t.c.totalBudget}</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.budget}</p></div>
              <div><p className="text-sm text-slate-500">{t.c.earned}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedContract.earned}</p></div>
              <div><p className="text-sm text-slate-500">{t.c.startDate}</p><p className="mt-2 text-xl font-semibold text-ink">{selectedContract.startDate}</p></div>
              <div><p className="text-sm text-slate-500">{t.c.endDate}</p><p className="mt-2 text-xl font-semibold text-ink">{selectedContract.endDate}</p></div>
            </div>
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-500"><span>{t.c.progress}</span><span className="font-semibold text-ink">{selectedContract.progress}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-200"><div className="h-2.5 rounded-full bg-indigo-600" style={{ width: `${selectedContract.progress}%` }} /></div>
              <p className="mt-2 text-sm text-slate-500">{selectedContract.completedMilestones} / {selectedContract.totalMilestones} {t.c.milestonesComplete}</p>
            </div>
          </SectionCard>
          <SectionCard className="rounded-[28px] border border-slate-200 p-6 shadow-sm xl:p-7">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Shield className="h-4 w-4" /></div><h3 className="text-2xl font-bold tracking-tight text-ink">{t.c.milestones}</h3></div>
            <div className="mt-6 space-y-4">
              {selectedContract.milestones.map((milestone) => {
                const iconMap = {
                  Approved: { wrapper: 'bg-indigo-100 text-indigo-600', icon: <HandCoins className="h-4 w-4" />, badge: 'bg-indigo-100 text-indigo-700' },
                  Completed: { wrapper: 'bg-emerald-100 text-emerald-600', icon: <CircleCheckBig className="h-4 w-4" />, badge: 'bg-emerald-100 text-emerald-700' },
                  'In Progress': { wrapper: 'bg-amber-100 text-amber-600', icon: <Clock3 className="h-4 w-4" />, badge: 'bg-amber-100 text-amber-700' },
                  Pending: { wrapper: 'bg-slate-100 text-slate-500', icon: <Hourglass className="h-4 w-4" />, badge: 'bg-slate-100 text-slate-600' },
                };
                const meta = iconMap[milestone.status];
                return (
                  <div key={text(milestone.title)} className="flex flex-col gap-4 rounded-2xl border border-slate-200 px-4 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.wrapper}`}>{meta.icon}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="truncate text-xl font-semibold tracking-tight text-ink">{text(milestone.title)}</p>
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${meta.badge}`}>{statusText(milestone.status)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{t.c.due} {milestone.dueDate}<span className="mx-2 text-slate-300">|</span><span className="font-semibold text-ink">{milestone.amount}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {milestone.action ? <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${milestone.action === 'Approve' ? 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{milestone.action === 'Approve' ? <Eye className="h-4 w-4" /> : <Upload className="h-4 w-4" />}{milestone.action === 'Approve' ? t.c.approve : t.c.submit}</button> : null}
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderEscrow = () => dashboardLayout(
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <SectionCard className="p-6">
        <div className="flex items-center justify-between">
          <div><p className="muted">{t.c.escrowPayment}</p><h2 className="mt-1 text-xl font-bold text-ink">{t.c.protectedBalance}</h2></div>
          <Wallet className="h-5 w-5 text-pine" />
        </div>
        <div className="mt-6 rounded-[28px] bg-ink p-6 text-white">
          <p className="text-sm text-white/70">{t.c.depositedAmount}</p>
          <p className="mt-2 text-4xl font-bold">{escrowSummary.amount}</p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-white/70">{t.c.status}</span>
            <StatusBadge status={escrowSummary.status} dark label={statusText(escrowSummary.status)} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">{t.c.release}</button>
          <button className="rounded-2xl border border-coral/30 bg-coral/10 px-5 py-3 text-sm font-semibold text-coral transition hover:bg-coral/15">{t.c.dispute}</button>
        </div>
      </SectionCard>
      <SectionCard className="p-6">
        <p className="muted">{t.c.escrowTimeline}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{t.c.currentFundState}</h2>
        <div className="mt-6 space-y-4">
          {escrowSummary.timeline.map((item) => (
            <div key={item.label} className="flex items-start justify-between rounded-2xl border border-slate-200 p-4">
              <div><p className="font-medium text-slate-900">{item.label}</p><p className="mt-1 text-sm text-slate-500">{item.date}</p></div>
              <StatusBadge status={item.state} label={statusText(item.state)} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <div className="min-h-screen">
      {activePage === 'landing' && renderLanding()}
      {activePage === 'dashboard' && renderDashboard()}
      {activePage === 'marketplace' && renderMarketplace()}
      {activePage === 'contracts' && renderContracts()}
      {activePage === 'escrow' && renderEscrow()}
    </div>
  );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  BriefcaseBusiness,
  Clock3,
  CreditCard,
  FileText,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

const adminSidebarItems = [
  { label: 'Dashboard', page: 'overview' },
  { label: 'Users', page: 'users' },
  { label: 'Jobs', page: 'jobs' },
  { label: 'Posts', page: 'posts' },
  { label: 'Contracts', page: 'contracts' },
  { label: 'Payments', page: 'payments' },
  { label: 'Disputes', page: 'disputes' },
];

const adminLabels = {
  Dashboard: 'Dashboard',
  Users: 'Users',
  Jobs: 'Jobs',
  Posts: 'Posts',
  Contracts: 'Contracts',
  Payments: 'Payments',
  Disputes: 'Disputes',
  workspace: 'Workspace',
  trustCenter: 'Admin Control',
  workspaceDesc: 'Live MongoDB control center for users, jobs, contracts, disputes, and payments.',
  balanceProtected: 'Protected volume',
  balanceDesc: 'Calculated from database transactions.',
};

const titles = {
  overview: 'Admin Dashboard',
  users: 'User Oversight',
  jobs: 'Job Oversight',
  posts: 'Post Moderation',
  contracts: 'Contract Monitoring',
  disputes: 'Dispute Desk',
  payments: 'Payment Control',
};

const emptyData = {
  users: [],
  posts: [],
  jobs: [],
  contracts: [],
  disputes: [],
  payments: [],
  stats: {
    totalUsers: 0,
    flaggedUsers: 0,
    postsPending: 0,
    postsFlagged: 0,
    openDisputes: 0,
    highSeverityDisputes: 0,
    protectedVolume: '$0',
    paymentActions: 0,
  },
  charts: {
    moderationTrend: [],
    riskDistribution: [],
  },
};

function statusTone(status) {
  if (['Escalated', 'High', 'On Hold', 'Under Review', 'Rejected', 'Banned', 'Failed'].includes(status)) return 'bg-rose-100 text-rose-700';
  if (['Review', 'Medium', 'Queued', 'Needs Evidence', 'Pending Release', 'Pending', 'Flagged', 'Monitor'].includes(status)) return 'bg-amber-100 text-amber-700';
  if (['Healthy', 'Released', 'Completed', 'Low', 'Approved', 'Open', 'Assigned'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
}

function matchesSearch(item, search) {
  return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || '{}'));
  const [search, setSearch] = useState('');
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem(TOKEN_KEY);

  const fetchAdminData = async () => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(nextData.message || 'Cannot load admin database data');
      }

      setData({ ...emptyData, ...nextData, charts: { ...emptyData.charts, ...(nextData.charts || {}) } });
    } catch (fetchError) {
      setError(fetchError.message);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const apiPatch = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Admin action failed');
    }

    return result;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = (language) => {
    const nextUser = {
      ...user,
      settings: {
        ...user?.settings,
        language,
      },
    };

    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const adminStats = useMemo(() => [
    { label: 'Total users', value: `${data.stats.totalUsers}`, hint: `${data.stats.flaggedUsers} flagged accounts`, icon: Users, accent: 'bg-pine/10 text-pine' },
    { label: 'Posts pending', value: `${data.stats.postsPending}`, hint: `${data.stats.postsFlagged} flagged by admin`, icon: FileText, accent: 'bg-sky-100 text-sky-700' },
    { label: 'Open disputes', value: `${data.stats.openDisputes}`, hint: `${data.stats.highSeverityDisputes} high severity`, icon: AlertTriangle, accent: 'bg-coral/10 text-coral' },
    { label: 'Protected volume', value: data.stats.protectedVolume, hint: `${data.stats.paymentActions} payment actions`, icon: BadgeDollarSign, accent: 'bg-gold/10 text-gold' },
  ], [data.stats]);

  const filteredUsers = data.users.filter((item) => matchesSearch(item, search));
  const filteredJobs = data.jobs.filter((item) => matchesSearch(item, search));
  const filteredPosts = data.posts.filter((item) => matchesSearch(item, search));
  const filteredContracts = data.contracts.filter((item) => matchesSearch(item, search));
  const filteredDisputes = data.disputes.filter((item) => matchesSearch(item, search));
  const filteredPayments = data.payments.filter((item) => matchesSearch(item, search));

  const updateUserModeration = async (item, body) => {
    try {
      const result = await apiPatch(`/admin/users/${item.roleKey}/${item.id}/moderation`, body);
      setData((current) => ({
        ...current,
        users: current.users.map((userItem) => (userItem.id === item.id && userItem.roleKey === item.roleKey ? result.user : userItem)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const updatePostStatus = async (item, moderationStatus) => {
    try {
      const result = await apiPatch(`/admin/jobs/${item.id}/moderation`, { moderationStatus });
      setData((current) => ({
        ...current,
        posts: current.posts.map((post) => (post.id === item.id ? result.post : post)),
        jobs: current.jobs.map((job) => (job.id === item.id ? result.post : job)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const updatePaymentState = async (item, status) => {
    try {
      const result = await apiPatch(`/admin/transactions/${item.id}/status`, { status });
      setData((current) => ({
        ...current,
        payments: current.payments.map((payment) => (payment.id === item.id ? result.payment : payment)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const overviewContent = (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="muted">MongoDB charts</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Weekly platform activity</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live database</span>
          </div>

          {data.charts.moderationTrend.length ? (
            <div className="mt-8 flex h-72 items-end gap-4">
              {data.charts.moderationTrend.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-60 w-full items-end justify-center gap-1 rounded-3xl bg-slate-50 px-2 py-3">
                    <div className="w-3 rounded-full bg-indigo-500" style={{ height: `${Math.max(item.disputes, 1) * 22}px` }} />
                    <div className="w-3 rounded-full bg-sky-500" style={{ height: `${Math.max(item.posts, 1) * 22}px` }} />
                    <div className="w-3 rounded-full bg-amber-400" style={{ height: `${Math.max(item.payments, 1) * 22}px` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No chart data yet" description="Create jobs, reviews, or transactions and the chart will populate from MongoDB." />
          )}
        </SectionCard>

        <SectionCard className="p-6">
          <p className="muted">Risk distribution</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">User status breakdown</h2>
          <div className="mt-6 space-y-4">
            {data.charts.riskDistribution.length ? data.charts.riskDistribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            )) : <EmptyState title="No users yet" description="Registered MongoDB accounts will appear here." />}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Database-only admin</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">MongoDB records only</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              This dashboard now renders only records returned by MongoDB through the backend API.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setActiveTab('users')} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">Review Users</button>
              <button onClick={() => setActiveTab('posts')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Moderate Posts</button>
              <button onClick={fetchAdminData} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Refresh Data</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Jobs in database</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.jobs.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Registered users</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.users.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.payments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const usersContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="User oversight" title="Manage database users, warnings, and bans" placeholder="Search user or reason" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredUsers.length ? filteredUsers.map((item) => (
          <div key={`${item.roleKey}-${item.id}`} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.risk)}`}>{item.risk} risk</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.role} · {item.email} · {item.warnings} warnings</p>
                <p className="mt-3 text-sm text-slate-600">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateUserModeration(item, { action: 'status', status: 'Review' })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark Review</button>
                <button onClick={() => updateUserModeration(item, { action: 'warn' })} className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Warn User</button>
                <button onClick={() => updateUserModeration(item, { action: 'status', status: 'Escalated' })} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Escalate</button>
                <button onClick={() => updateUserModeration(item, { action: item.banned ? 'unban' : 'ban' })} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${item.banned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {item.banned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No users found" description="Only real client, freelancer, and admin accounts from MongoDB will appear here." />}
      </div>
    </SectionCard>
  );

  const jobsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Job oversight" title="Jobs stored in MongoDB" placeholder="Search job, client, or skill" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {filteredJobs.length ? filteredJobs.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
                <h3 className="mt-4 text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.client} · {item.category} · {item.budget}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{item.jobStatus}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.skills?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.skills.slice(0, 6).map((skill) => <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">{skill}</span>)}
              </div>
            ) : null}
          </div>
        )) : <EmptyState title="No jobs found" description="When clients create jobs, they will show here from MongoDB." />}
      </div>
    </SectionCard>
  );

  const postsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Post moderation" title="Approve, flag, or reject database jobs" placeholder="Search post or author" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredPosts.length ? filteredPosts.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.category}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.author} · {item.reports} reports</p>
                <p className="mt-3 text-sm text-slate-600">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updatePostStatus(item, 'approved')} className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                <button onClick={() => updatePostStatus(item, 'flagged')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Flag</button>
                <button onClick={() => updatePostStatus(item, 'rejected')} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Reject</button>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No posts to moderate" description="Job posts from MongoDB will appear here." />}
      </div>
    </SectionCard>
  );

  const contractsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Contract monitoring" title="Accepted jobs and active contract states" placeholder="Search contract or owner" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredContracts.length ? filteredContracts.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.state)}`}>{item.state}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.payoutRisk)}`}>{item.payoutRisk} payout risk</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.owner}</p>
                <p className="mt-3 text-sm text-slate-600">Protected amount {item.amount} · current completion {item.progress}</p>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No active contracts" description="When freelancers accept jobs, the contract records will appear here." />}
      </div>
    </SectionCard>
  );

  const disputesContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Dispute desk" title="Pending review and dispute records" placeholder="Search dispute" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredDisputes.length ? filteredDisputes.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-ink">{item.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.severity)}`}>{item.severity}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{item.summary}</p>
          </div>
        )) : <EmptyState title="No disputes found" description="There are no pending dispute or review records in MongoDB." />}
      </div>
    </SectionCard>
  );

  const paymentsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Payment queue" title="Transactions from MongoDB" placeholder="Search payment or account" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredPayments.length ? filteredPayments.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.contract}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.state)}`}>{item.state}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.account} · {item.amount}</p>
                <p className="mt-3 text-sm text-slate-600">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updatePaymentState(item, 'pending')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Hold</button>
                <button onClick={() => updatePaymentState(item, 'completed')} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Mark Completed</button>
                <button onClick={() => updatePaymentState(item, 'failed')} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Fail</button>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No transactions found" description="Deposits, withdrawals, and releases will appear here after they are saved to MongoDB." />}
      </div>
    </SectionCard>
  );

  const tabContent = {
    overview: overviewContent,
    users: usersContent,
    jobs: jobsContent,
    posts: postsContent,
    contracts: contractsContent,
    disputes: disputesContent,
    payments: paymentsContent,
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={adminSidebarItems} activePage={activeTab} onNavigate={setActiveTab} labels={adminLabels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={titles[activeTab]}
            subtitle="Administrator workspace connected to MongoDB"
            onLogout={logout}
            onOpenSettings={() => setActiveTab('overview')}
            onOpenBankSettings={() => setActiveTab('payments')}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'admin', logout: 'Logout' }}
            user={user}
          />

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
          {loading ? (
            <SectionCard className="p-8">
              <p className="text-sm font-semibold text-slate-500">Loading MongoDB data...</p>
            </SectionCard>
          ) : tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ eyebrow, title, placeholder, search, setSearch }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="muted">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
      </label>
    </div>
  );
}

export default AdminDashboard;

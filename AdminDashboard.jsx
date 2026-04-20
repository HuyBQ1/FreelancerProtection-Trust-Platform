import { useMemo, useState } from 'react';
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
import JobCard from '../components/JobCard';

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
  workspaceDesc: 'Oversee users, posts, contracts, disputes, and protected platform payments in one admin workspace.',
  balanceProtected: 'Protected volume',
  balanceDesc: 'Across monitored contracts and payout queues.',
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

const seedUsers = [
  { id: 1, name: 'Northstar Capital', role: 'Client', status: 'Monitor', risk: 'Medium', contracts: 12, warnings: 1, banned: false, reason: 'Multiple late approval complaints' },
  { id: 2, name: 'Ariana Lee', role: 'Freelancer', status: 'Review', risk: 'High', contracts: 8, warnings: 2, banned: false, reason: 'High dispute volume on recent milestone submissions' },
  { id: 3, name: 'Bridge Legal', role: 'Client', status: 'Escalated', risk: 'High', contracts: 4, warnings: 3, banned: false, reason: 'Repeated payout delay flags' },
  { id: 4, name: 'Helix Networks', role: 'Client', status: 'Healthy', risk: 'Low', contracts: 9, warnings: 0, banned: false, reason: 'No active risk signal. Included for comparison.' },
];

const seedPosts = [
  { id: 1, title: 'Need React dashboard cleanup', author: 'Northstar Capital', category: 'Job post', status: 'Pending', reports: 0, reason: 'Awaiting admin approval before publishing.' },
  { id: 2, title: 'Brand designer wanted urgently', author: 'Bridge Legal', category: 'Job post', status: 'Flagged', reports: 3, reason: 'Community flagged unclear payment language and policy issues.' },
  { id: 3, title: 'Freelancer profile showcase update', author: 'Ariana Lee', category: 'Profile update', status: 'Approved', reports: 0, reason: 'No policy issue detected.' },
];

const seedJobs = [
  {
    id: 1,
    title: 'Senior React freelancer shortlist',
    budget: '$4,500',
    client: 'Acme Ventures',
    category: 'Development',
    description: 'Review top candidates for your trust portal build and compare availability, rates, and ratings.',
    requirements: 'Create a responsive React dashboard with escrow management, contract approvals, and client-facing job controls.',
    posted: '2 days ago',
    delivery: '2 weeks',
    deadline: '30 May 2026',
    location: 'Remote',
    freelancersNeeded: '3 freelancers',
    availability: 'Available in 3 days',
    hourlyRate: '$68/hr',
    completedJobs: '38',
    completionRate: '98%',
    responseTime: '1 hour',
    clientRating: '4.9 / 5',
    escrowSuccessRate: '100%',
    skills: ['React', 'Tailwind CSS', 'Node.js'],
    attachments: ['requirements.pdf', 'design.png'],
  },
];

const seedContracts = [
  { id: 1, title: 'Mobile App UI Design', owner: 'Acme Corp / Ariana Lee', amount: '$4,200', state: 'Held for review', progress: '50%', payoutRisk: 'Medium' },
  { id: 2, title: 'Trust Portal Frontend', owner: 'SecureFlow Labs / Daniel Cruz', amount: '$7,800', state: 'Protected in escrow', progress: '65%', payoutRisk: 'Low' },
  { id: 3, title: 'Brand Identity Package', owner: 'StartupXYZ / Ariana Lee', amount: '$2,200', state: 'Completed', progress: '100%', payoutRisk: 'Low' },
];

const seedDisputes = [
  { id: 1, title: 'Prototype delivery dispute', severity: 'High', age: '2 days', summary: 'Client claims additional scope mismatch before payout.', status: 'Under Review' },
  { id: 2, title: 'Escrow release delay', severity: 'Medium', age: '5 hours', summary: 'Freelancer requested manual review of blocked release.', status: 'Queued' },
  { id: 3, title: 'Brand revision scope change', severity: 'Low', age: '1 day', summary: 'Scope interpretation differs between client and freelancer.', status: 'Needs Evidence' },
];

const seedPayments = [
  { id: 1, contract: 'Mobile App UI Design', account: 'Ariana Lee', amount: '$1,200', state: 'On Hold', reason: 'Awaiting dispute review' },
  { id: 2, contract: 'Trust Portal Frontend', account: 'Daniel Cruz', amount: '$2,600', state: 'Pending Release', reason: 'Milestone approved, queued for release' },
  { id: 3, contract: 'Brand Identity Package', account: 'Ariana Lee', amount: '$800', state: 'Released', reason: 'Completed and approved' },
];

const moderationTrend = [
  { label: 'Mon', disputes: 3, posts: 5, payments: 2 },
  { label: 'Tue', disputes: 5, posts: 4, payments: 3 },
  { label: 'Wed', disputes: 4, posts: 6, payments: 2 },
  { label: 'Thu', disputes: 6, posts: 3, payments: 4 },
  { label: 'Fri', disputes: 7, posts: 5, payments: 5 },
  { label: 'Sat', disputes: 2, posts: 2, payments: 1 },
  { label: 'Sun', disputes: 3, posts: 1, payments: 2 },
];

const riskDistribution = [
  { label: 'Healthy', value: 42, tone: 'bg-emerald-500' },
  { label: 'Monitor', value: 28, tone: 'bg-amber-400' },
  { label: 'Escalated', value: 18, tone: 'bg-rose-500' },
  { label: 'Banned', value: 12, tone: 'bg-slate-800' },
];

function statusTone(status) {
  if (['Escalated', 'High', 'On Hold', 'Under Review', 'Rejected', 'Banned'].includes(status)) return 'bg-rose-100 text-rose-700';
  if (['Review', 'Medium', 'Queued', 'Needs Evidence', 'Pending Release', 'Pending', 'Flagged', 'Monitor'].includes(status)) return 'bg-amber-100 text-amber-700';
  if (['Healthy', 'Released', 'Completed', 'Low', 'Approved'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
}

function normalizeAdminJob(job, idx) {
  const title = typeof job.title === 'string' ? job.title : job.title?.en || job.title?.vi || '';
  const category = typeof job.category === 'string' ? job.category : job.category?.en || job.category?.vi || 'General';
  const description = typeof job.description === 'string' ? job.description : job.description?.en || job.description?.vi || '';

  return {
    id: job.id || idx + 1,
    ...job,
    title,
    category,
    description,
    requirements: job.requirements || description,
    client: job.client || 'Client',
    budget: job.budget || 'TBD',
    delivery: job.delivery || 'TBD',
    deadline: job.deadline || 'TBD',
    location: job.location || 'Remote',
    freelancersNeeded: job.freelancersNeeded || '1 freelancer',
    availability: job.availability || 'Available in 3 days',
    hourlyRate: job.hourlyRate || '$68/hr',
    completedJobs: job.completedJobs || '38',
    completionRate: job.completionRate || '98%',
    responseTime: job.responseTime || '1 hour',
    clientRating: job.clientRating || '4.9 / 5',
    escrowSuccessRate: job.escrowSuccessRate || '100%',
    skills: Array.isArray(job.skills) ? job.skills : [],
    attachments: Array.isArray(job.attachments) ? job.attachments : [],
  };
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [users, setUsers] = useState(seedUsers);
  const [posts, setPosts] = useState(seedPosts);
  const [contracts, setContracts] = useState(seedContracts);
  const [disputes, setDisputes] = useState(seedDisputes);
  const [payments, setPayments] = useState(seedPayments);
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('client_jobs');
    const source = saved ? JSON.parse(saved) : seedJobs;
    return source.map((item, idx) => normalizeAdminJob(item, idx));
  });

  const logout = () => {
    localStorage.removeItem('fptp_token');
    localStorage.removeItem('fptp_user');
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
    localStorage.setItem('fptp_user', JSON.stringify(nextUser));
  };

  const adminStats = useMemo(() => [
    { label: 'Total users', value: `${users.length * 620}`, hint: `${users.filter((item) => item.status !== 'Healthy').length} flagged groups`, icon: Users, accent: 'bg-pine/10 text-pine' },
    { label: 'Posts pending', value: `${posts.filter((item) => item.status === 'Pending' || item.status === 'Flagged').length}`, hint: `${posts.filter((item) => item.status === 'Flagged').length} flagged by reports`, icon: FileText, accent: 'bg-sky-100 text-sky-700' },
    { label: 'Open disputes', value: `${disputes.filter((item) => item.status !== 'Resolved').length}`, hint: `${disputes.filter((item) => item.severity === 'High').length} high severity`, icon: AlertTriangle, accent: 'bg-coral/10 text-coral' },
    { label: 'Protected volume', value: '$186,400', hint: `${payments.filter((item) => item.state !== 'Released').length} payment actions`, icon: BadgeDollarSign, accent: 'bg-gold/10 text-gold' },
  ], [disputes, payments, posts, users]);

  const filteredUsers = users.filter((item) => `${item.name} ${item.role} ${item.reason}`.toLowerCase().includes(search.toLowerCase()));
  const filteredJobs = jobs.filter((item) => `${item.title} ${item.client} ${item.category} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  const filteredPosts = posts.filter((item) => `${item.title} ${item.author} ${item.status} ${item.reason}`.toLowerCase().includes(search.toLowerCase()));
  const filteredContracts = contracts.filter((item) => `${item.title} ${item.owner} ${item.state}`.toLowerCase().includes(search.toLowerCase()));
  const filteredDisputes = disputes.filter((item) => `${item.title} ${item.summary} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const filteredPayments = payments.filter((item) => `${item.contract} ${item.account} ${item.state}`.toLowerCase().includes(search.toLowerCase()));

  const updateUserStatus = (id, status) => {
    setUsers((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const warnUser = (id) => {
    setUsers((current) => current.map((item) => (
      item.id === id
        ? {
          ...item,
          warnings: item.warnings + 1,
          status: item.warnings + 1 >= 3 ? 'Escalated' : 'Review',
          risk: item.warnings + 1 >= 3 ? 'High' : item.risk,
        }
        : item
    )));
  };

  const banUser = (id) => {
    setUsers((current) => current.map((item) => (
      item.id === id
        ? {
          ...item,
          banned: true,
          status: 'Banned',
          risk: 'High',
        }
        : item
    )));
  };

  const toggleBanUser = (id) => {
    setUsers((current) => current.map((item) => {
      if (item.id !== id) return item;

      if (item.banned) {
        return {
          ...item,
          banned: false,
          status: item.warnings > 0 ? 'Review' : 'Healthy',
          risk: item.warnings >= 3 ? 'High' : item.warnings > 0 ? 'Medium' : 'Low',
        };
      }

      return {
        ...item,
        banned: true,
        status: 'Banned',
        risk: 'High',
      };
    }));
  };

  const updatePostStatus = (id, status) => {
    setPosts((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const updateContractState = (id, state) => {
    setContracts((current) => current.map((item) => (item.id === id ? { ...item, state } : item)));
  };

  const updateDisputeStatus = (id, status) => {
    setDisputes((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const updatePaymentState = (id, state) => {
    setPayments((current) => current.map((item) => (item.id === id ? { ...item, state } : item)));
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
              <p className="muted">Platform charts</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Weekly moderation activity</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Disputes</span>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Posts</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Payments</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex h-72 items-end gap-4">
              {moderationTrend.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-60 w-full items-end justify-center gap-1 rounded-3xl bg-slate-50 px-2 py-3">
                    <div className="w-3 rounded-full bg-indigo-500" style={{ height: `${item.disputes * 22}px` }} />
                    <div className="w-3 rounded-full bg-sky-500" style={{ height: `${item.posts * 22}px` }} />
                    <div className="w-3 rounded-full bg-amber-400" style={{ height: `${item.payments * 22}px` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <p className="muted">Risk distribution</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">User status breakdown</h2>
          <div className="mt-6 space-y-4">
            {riskDistribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-ink px-6 py-8 text-white sm:px-8">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Admin command center</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Platform oversight across users, posts, disputes, contracts, and protected funds</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
                Review risky behavior, moderate public posts, warn or ban users, and protect escrow flow from one admin workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setActiveTab('users')} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">Review Users</button>
                <button onClick={() => setActiveTab('posts')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Moderate Posts</button>
                <button onClick={() => setActiveTab('disputes')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Open Disputes</button>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-8 sm:px-8">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Posts awaiting review</p>
                  <p className="mt-2 text-3xl font-bold text-ink">{posts.filter((item) => item.status === 'Pending' || item.status === 'Flagged').length}</p>
                  <p className="mt-2 text-sm text-slate-500">Posts and profile updates waiting for moderation.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Users with warnings</p>
                  <p className="mt-2 text-3xl font-bold text-ink">{users.filter((item) => item.warnings > 0).length}</p>
                  <p className="mt-2 text-sm text-slate-500">Accounts currently in the warning system.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Held payments</p>
                  <p className="mt-2 text-3xl font-bold text-ink">{payments.filter((item) => item.state === 'On Hold').length}</p>
                  <p className="mt-2 text-sm text-slate-500">Payments currently paused pending manual review.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">Moderator queue</p>
              <h2 className="text-2xl font-bold text-ink">Today’s priority actions</h2>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              'Investigate high-severity prototype delivery dispute',
              'Approve or reject newly submitted public posts',
              'Review repeated late approval complaints from flagged users',
              'Audit payout hold queue for blocked milestone releases',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const usersContent = (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="muted">User oversight</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Manage users, warnings, and bans</h2>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user or reason" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
        </label>
      </div>
      <div className="mt-6 space-y-4">
        {filteredUsers.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.risk)}`}>{item.risk} risk</span>
                  {item.banned ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Banned</span> : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.role} · {item.contracts} linked contracts · {item.warnings} warnings</p>
                <p className="mt-3 text-sm text-slate-600">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateUserStatus(item.id, 'Review')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark Review</button>
                <button onClick={() => warnUser(item.id)} className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Warn User</button>
                <button onClick={() => updateUserStatus(item.id, 'Escalated')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Escalate</button>
                <button onClick={() => toggleBanUser(item.id)} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${item.banned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {item.banned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const jobsContent = (
    <div className="space-y-6">
      <SectionCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="muted">Job oversight</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Review active job postings</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs or clients" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
            </label>
            <button
              type="button"
              onClick={() => {
                const saved = localStorage.getItem('client_jobs');
                const source = saved ? JSON.parse(saved) : seedJobs;
                setJobs(source.map((item, idx) => normalizeAdminJob(item, idx)));
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh jobs
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4">
        {filteredJobs.map((item) => (
          <JobCard
            key={`${item.title}-${item.client}-${item.id}`}
            job={item}
            labels={{ budget: 'Budget', client: 'Client', view: 'View details' }}
            onView={() => setSelectedJob(item)}
          />
        ))}
      </div>

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] bg-slate-100 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedJob(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              X
            </button>
            <div className="max-h-[84vh] overflow-y-auto p-3 sm:p-4">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] bg-[#091839] p-6 text-white">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/85">{selectedJob.category}</span>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">Admin monitored</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-bold leading-tight">{selectedJob.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/80">{selectedJob.requirements || selectedJob.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(selectedJob.skills.length ? selectedJob.skills : ['Protected payments', 'Clear scope', 'Fast communication']).slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85">{skill}</span>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Client</p><p className="mt-1 text-xl font-semibold text-white">{selectedJob.client}</p></div>
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Project duration</p><p className="mt-1 text-xl font-semibold text-white">{selectedJob.delivery}</p></div>
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Freelancers needed</p><p className="mt-1 text-xl font-semibold text-white">{selectedJob.freelancersNeeded}</p></div>
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Deadline</p><p className="mt-1 text-xl font-semibold text-white">{selectedJob.deadline}</p></div>
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Hourly rate</p><p className="mt-1 text-2xl font-bold text-white">{selectedJob.hourlyRate}</p></div>
                    <div className="rounded-2xl bg-white/8 p-4"><p className="text-xs text-white/70">Completed jobs</p><p className="mt-1 text-2xl font-bold text-white">{selectedJob.completedJobs}</p></div>
                  </div>
                </div>
                <div className="space-y-3 rounded-[24px] bg-white p-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Location</p><p className="mt-1 text-2xl font-semibold text-ink">{selectedJob.location}</p></div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Availability</p><p className="mt-1 text-2xl font-semibold text-ink">{selectedJob.availability}</p></div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Client rating</p><p className="mt-1 text-2xl font-semibold text-ink">{selectedJob.clientRating}</p></div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Escrow success rate</p><p className="mt-1 text-2xl font-semibold text-ink">{selectedJob.escrowSuccessRate}</p></div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Attachments</p><p className="mt-1 text-base font-medium text-ink">{selectedJob.attachments.length ? selectedJob.attachments.join(', ') : '-'}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const postsContent = (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="muted">Post moderation</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Approve, flag, or reject submitted posts</h2>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search post or author" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
        </label>
      </div>
      <div className="mt-6 space-y-4">
        {filteredPosts.map((item) => (
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
                <button onClick={() => updatePostStatus(item.id, 'Approved')} className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                <button onClick={() => updatePostStatus(item.id, 'Flagged')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Flag</button>
                <button onClick={() => updatePostStatus(item.id, 'Rejected')} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const contractsContent = (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="muted">Contract monitoring</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">High-value contracts and payout risk</h2>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contract or owner" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
        </label>
      </div>
      <div className="mt-6 space-y-4">
        {filteredContracts.map((item) => (
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
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateContractState(item.id, 'Protected in escrow')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Protect</button>
                <button onClick={() => updateContractState(item.id, 'Held for review')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Hold Review</button>
                <button onClick={() => updateContractState(item.id, 'Completed')} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Mark Complete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const disputesContent = (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="muted">Dispute desk</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Moderate open cases</h2>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dispute" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
        </label>
      </div>
      <div className="mt-6 space-y-4">
        {filteredDisputes.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.severity)}`}>{item.severity}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Opened {item.age} ago</p>
                <p className="mt-3 text-sm text-slate-600">{item.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateDisputeStatus(item.id, 'Needs Evidence')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Request Evidence</button>
                <button onClick={() => updateDisputeStatus(item.id, 'Under Review')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Review</button>
                <button onClick={() => updateDisputeStatus(item.id, 'Resolved')} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Resolve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const paymentsContent = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">Escrow volume</p>
              <h2 className="text-2xl font-bold text-ink">$186,400 protected</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending release queue</p>
              <p className="mt-2 text-3xl font-bold text-ink">{payments.filter((item) => item.state === 'Pending Release').length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Payments on hold</p>
              <p className="mt-2 text-3xl font-bold text-ink">{payments.filter((item) => item.state === 'On Hold').length}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">Admin actions</p>
              <h2 className="text-2xl font-bold text-ink">Payment controls</h2>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {['Review payout hold queue', 'Approve manual release requests', 'Inspect flagged withdrawal accounts', 'Audit completed release batch'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="muted">Payment queue</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Manual payout decisions</h2>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search payment or account" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
          </label>
        </div>
        <div className="mt-6 space-y-4">
          {filteredPayments.map((item) => (
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
                  <button onClick={() => updatePaymentState(item.id, 'On Hold')} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Hold</button>
                  <button onClick={() => updatePaymentState(item.id, 'Pending Release')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Queue</button>
                  <button onClick={() => updatePaymentState(item.id, 'Released')} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Release</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
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
            subtitle="Administrator workspace for trust, payout, and platform controls"
            onLogout={logout}
            onOpenSettings={() => setActiveTab('overview')}
            onOpenBankSettings={() => setActiveTab('payments')}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'admin', logout: 'Logout' }}
            user={user}
          />

          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

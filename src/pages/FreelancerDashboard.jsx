import React, { useState, useEffect } from 'react';
import { ChevronRight, CircleCheckBig, Clock3, Eye, HandCoins, Hourglass, Search, Shield, Upload, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import StatusBadge from '../components/StatusBadge';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import { activities, contracts, disputes, escrowSummary, jobs, sidebarItems, stats } from '../data/mockData';
import { createContractFromAcceptedJob } from '../utils/contractTransforms';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LOCAL_CLIENT_JOBS_KEY = 'fptp_client_jobs';
const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
const filters = ['All', 'Design', 'Development', 'Security', 'Legal'];

function readLocalJobs() {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENT_JOBS_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const labels = {
  Dashboard: 'Dashboard',
  Jobs: 'Jobs',
  Contracts: 'Contracts',
  Chat: 'Chat',
  'Bank Account': 'Bank Account',
  Payments: 'Payments',
  Disputes: 'Disputes',
  workspace: 'Workspace',
  trustCenter: 'Trust Center',
  workspaceDesc: 'Manage jobs, contracts, payments, and disputes in one place.',
  balanceProtected: 'Protected balance',
  balanceDesc: 'Held across 8 active escrow contracts.',
};

const titles = {
  dashboard: 'Dashboard',
  marketplace: 'Marketplace',
  contracts: 'Contracts',
  chat: 'Chat',
  bank: 'Bank Account',
  escrow: 'Escrow',
  disputes: 'Disputes',
  settings: 'Settings',
};

function FreelancerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingInitialContractId, setPendingInitialContractId] = useState(location.state?.initialContractId || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [settingsSection, setSettingsSection] = useState('profile');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id ?? 1);
  const [selectedDisputeId, setSelectedDisputeId] = useState(disputes[0]?.id ?? 1);
  const [escrowBalance, setEscrowBalance] = useState(escrowSummary.amount);
  const [jobList, setJobList] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);

  useEffect(() => {
    if (location.state?.initialPage) {
      setActivePage(location.state.initialPage);
    }

    if (location.state?.initialContractId) {
      setPendingInitialContractId(location.state.initialContractId);
    }
  }, [location.state]);

  // Fetch Escrow Summary from Backend
  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('fptp_token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/escrow/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.summary && data.summary.balance !== undefined) {
          const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(data.summary.balance);
          setEscrowBalance(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch escrow summary:', err);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setJobList(readLocalJobs());
          return;
        }

        if (Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobList(data.jobs);
        } else {
          setJobList(readLocalJobs());
        }
      } catch (err) {
        console.error('Failed to fetch public jobs:', err);
        setJobList(readLocalJobs());
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchAssignedJobs = async () => {
      try {
        const token = localStorage.getItem('fptp_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/jobs/assigned`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          return;
        }

        setAcceptedJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (error) {
        console.error('Failed to fetch accepted jobs:', error);
      }
    };

    fetchAssignedJobs();
  }, [location.state?.initialContractId]);

  const marketplaceJobs = jobList.length > 0
    ? jobList
    : jobs.map((job, index) => ({
      id: `mock-job-${index + 1}`,
      title: job.title.en,
      budget: job.budget,
      client: job.client,
      category: job.category.en,
      description: job.description.en,
      experienceLevel: '',
      timeline: '',
      locationType: '',
      engagementType: '',
      scopeSummary: '',
      skills: [],
    }));

  const filteredJobs = marketplaceJobs.filter((job) => (
    (job.title.toLowerCase().includes(query.toLowerCase()) || job.client.toLowerCase().includes(query.toLowerCase())) &&
    (selectedFilter === 'All' || job.category === selectedFilter)
  ));
  const contractList = [...acceptedJobs.map(createContractFromAcceptedJob), ...contracts];
  const selectedContract = contractList.find((item) => item.id === selectedContractId) ?? contractList[0];
  const selectedDispute = disputes.find((item) => item.id === selectedDisputeId) ?? disputes[0];

  useEffect(() => {
    if (pendingInitialContractId) {
      setSelectedContractId(pendingInitialContractId);
      setPendingInitialContractId('');
      return;
    }

    if (contractList.length > 0 && !contractList.some((item) => item.id === selectedContractId)) {
      setSelectedContractId(contractList[0].id);
    }
  }, [contractList, pendingInitialContractId, selectedContractId]);

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

  const openContractBrief = (contract) => {
    if (contract?.source === 'job-acceptance' && contract?.sourceJobId) {
      navigate(`/freelancer-jobs/${contract.sourceJobId}`);
    }
  };

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={titles[activePage]}
            subtitle="Freelancer Protection & Trust Platform"
            onLogout={logout}
            onOpenSettings={() => {
              setSettingsSection('profile');
              setActivePage('settings');
            }}
            onOpenBankSettings={() => {
              setActivePage('bank');
            }}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'freelancer', logout: 'Logout' }}
            user={user}
          />
          <div className="flex flex-wrap gap-2">
            {pageTabs.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activePage === page ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
              >
                {titles[page]}
              </button>
            ))}
          </div>
          {content}
        </div>
      </div>
    </div>
  );

  if (activePage === 'marketplace') {
    return dashboardLayout(
      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="muted">Marketplace</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Find the right jobs</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs or clients" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-60" />
              </label>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button key={filter} onClick={() => setSelectedFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFilter === filter ? 'bg-pine text-white' : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}>
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredJobs.map((job) => (
              <JobCard
                key={job.id || job.title}
                job={job}
                labels={{ budget: 'Budget', client: 'Client' }}
                actionLabel="View Job"
                onAction={() => navigate(`/freelancer-jobs/${job.id || job.title}`)}
              />
            ))}
        </div>
        {filteredJobs.length === 0 ? (
          <SectionCard className="p-6">
            <p className="muted">No jobs found</p>
            <h3 className="mt-2 text-xl font-bold text-ink">Try a different search or filter</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              We could not find a matching job in the current list. Clear the filters or try another keyword.
            </p>
          </SectionCard>
        ) : null}
      </div>,
    );
  }

  if (activePage === 'contracts') {
    const progressWidth = `${selectedContract.progress}%`;
    const milestoneMeta = {
      Approved: { wrapper: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', icon: <HandCoins className="h-4 w-4" /> },
      Completed: { wrapper: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', icon: <CircleCheckBig className="h-4 w-4" /> },
      'In Progress': { wrapper: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: <Clock3 className="h-4 w-4" /> },
      Pending: { wrapper: 'bg-slate-100 text-slate-500', badge: 'bg-slate-100 text-slate-600', icon: <Hourglass className="h-4 w-4" /> },
    };

    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Contracts</h2>
          <p className="mt-2 text-sm text-slate-500">{contractList.length} contracts total</p>
        </div>
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {contractList.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(contract.id)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${contract.id === selectedContract.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-ink">{contract.title.en}</p>
                    <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{contract.status}</span>
                </div>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <div className="space-y-5">
            <SectionCard className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-ink">{selectedContract.title.en}</h3>
                  <p className="mt-2 flex items-center gap-2 text-slate-500"><UserRound className="h-4 w-4" />{selectedContract.client}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${selectedContract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{selectedContract.status}</span>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-sm text-slate-500">Total budget</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.budget}</p></div>
                <div><p className="text-sm text-slate-500">Earned</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedContract.earned}</p></div>
                <div><p className="text-sm text-slate-500">Start date</p><p className="mt-2 text-lg font-semibold text-ink">{selectedContract.startDate}</p></div>
                <div><p className="text-sm text-slate-500">End date</p><p className="mt-2 text-lg font-semibold text-ink">{selectedContract.endDate}</p></div>
              </div>
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500"><span>Progress</span><span className="font-semibold text-slate-700">{selectedContract.progress}%</span></div>
                <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-indigo-600" style={{ width: progressWidth }} /></div>
                <p className="mt-2 text-sm text-slate-500">{selectedContract.completedMilestones} of {selectedContract.totalMilestones} milestones complete</p>
              </div>
            </SectionCard>
            <SectionCard className="p-6">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Shield className="h-4 w-4" /></div><h3 className="text-2xl font-bold text-ink">Milestones</h3></div>
              <div className="mt-6 space-y-4">
                {selectedContract.milestones.map((milestone) => {
                  const meta = milestoneMeta[milestone.status] || milestoneMeta.Pending;
                  const isApprove = milestone.action === 'Approve';
                  return (
                    <div key={milestone.title.en} className="flex flex-col gap-4 rounded-2xl border border-slate-200 px-4 py-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.wrapper}`}>{meta.icon}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3"><p className="truncate text-lg font-semibold text-ink">{milestone.title.en}</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>{milestone.status}</span></div>
                          <p className="mt-1 text-sm text-slate-500">Due {milestone.dueDate}<span className="mx-2 text-slate-300">|</span><span className="font-semibold text-ink">{milestone.amount}</span></p>
                          {milestone.reviewNote ? <p className="mt-2 text-sm text-slate-500">{milestone.reviewNote}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        {milestone.reviewAction ? <button onClick={() => openContractBrief(selectedContract)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"><Eye className="h-4 w-4" />{milestone.reviewAction}</button> : null}
                        {milestone.action ? <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isApprove ? 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isApprove ? <Eye className="h-4 w-4" /> : <Upload className="h-4 w-4" />}{milestone.action}</button> : null}
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>,
    );
  }

  if (activePage === 'escrow') {
    return dashboardLayout(
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard className="p-6">
          <div className="flex items-center justify-between"><div><p className="muted">Escrow</p><h2 className="mt-1 text-xl font-bold text-ink">Protected balance</h2></div><Shield className="h-5 w-5 text-pine" /></div>
          <div className="mt-6 rounded-[28px] bg-ink p-6 text-white"><p className="text-sm text-white/70">Deposited amount</p><p className="mt-2 text-4xl font-bold">{escrowBalance}</p><div className="mt-5 flex items-center justify-between"><span className="text-sm text-white/70">Status</span><StatusBadge status={escrowSummary.status} dark label={escrowSummary.status} /></div></div>
        </SectionCard>
        <SectionCard className="p-6">
          <p className="muted">Escrow timeline</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Current fund state</h2>
          <div className="mt-6 space-y-4">
            {escrowSummary.timeline.map((item) => <div key={item.label} className="flex items-start justify-between rounded-2xl border border-slate-200 p-4"><div><p className="font-medium text-slate-900">{item.label}</p><p className="mt-1 text-sm text-slate-500">{item.date}</p></div><StatusBadge status={item.state} label={item.state} /></div>)}
          </div>
        </SectionCard>
      </div>,
    );
  }

  if (activePage === 'chat') {
    return dashboardLayout(
      <ChatPanel
        currentUser={user}
        userName={user?.fullName || user?.email || 'Freelancer'}
        initialThreadId={location.state?.initialThreadId || ''}
      />,
    );
  }

  if (activePage === 'bank') {
    return dashboardLayout(
      <SettingsPanel user={user} onUserChange={setUser} initialSection="bank" mode="bank" />,
    );
  }

  if (activePage === 'disputes') {
    return dashboardLayout(
      <div className="space-y-6">
        <div><h2 className="text-3xl font-bold tracking-tight text-ink">Disputes</h2><p className="mt-2 text-sm text-slate-500">{disputes.length} cases tracked</p></div>
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {disputes.map((dispute) => <button key={dispute.id} onClick={() => setSelectedDisputeId(dispute.id)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${dispute.id === selectedDispute.id ? 'border-coral ring-2 ring-coral/20' : 'border-slate-200 hover:border-slate-300'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold text-ink">{dispute.title.en}</p><p className="mt-1 text-sm text-slate-500">{dispute.contract.en}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${dispute.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{dispute.status}</span></div><div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{dispute.client}</span><span className="font-semibold text-ink">{dispute.amount}</span></div></button>)}
          </div>
          <div className="space-y-5">
            <SectionCard className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div><h3 className="text-2xl font-bold text-ink">{selectedDispute.title.en}</h3><p className="mt-2 text-slate-500">{selectedDispute.contract.en} Â· {selectedDispute.client}</p></div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${selectedDispute.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedDispute.status}</span>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div><p className="text-sm text-slate-500">Amount in review</p><p className="mt-2 text-2xl font-bold text-ink">{selectedDispute.amount}</p></div>
                <div><p className="text-sm text-slate-500">Opened at</p><p className="mt-2 text-lg font-semibold text-ink">{selectedDispute.openedAt}</p></div>
                <div><p className="text-sm text-slate-500">Case owner</p><p className="mt-2 text-lg font-semibold text-ink">{selectedDispute.client}</p></div>
              </div>
              <p className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{selectedDispute.summary.en}</p>
            </SectionCard>
            <SectionCard className="p-6">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/10 text-coral"><Shield className="h-4 w-4" /></div><h3 className="text-2xl font-bold text-ink">Case timeline</h3></div>
              <div className="mt-6 space-y-4">{selectedDispute.timeline.map((item) => <div key={`${item.label}-${item.date}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-ink">{item.label}</p><span className="text-sm text-slate-400">{item.date}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p></div>)}</div>
            </SectionCard>
          </div>
        </div>
      </div>,
    );
  }

  if (activePage === 'settings') {
    return dashboardLayout(
      <SettingsPanel user={user} onUserChange={setUser} initialSection={settingsSection} />,
    );
  }

  return dashboardLayout(
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label.en} {...stat} label={stat.label.en} hint={stat.hint.en} value={stat.label.en === 'Balance' && escrowBalance ? escrowBalance : stat.value} />)}
      </section>
      <SectionCard className="p-6">
        <div><p className="muted">Recent activities</p><h2 className="mt-1 text-xl font-bold text-ink">Platform overview</h2></div>
        <div className="mt-6 space-y-4">{activities.map((activity) => <div key={activity.title.en} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div><div className="flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">{activity.title.en}</h3><span className="text-sm text-slate-400">{activity.time.en}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{activity.description.en}</p></div></div>)}</div>
      </SectionCard>
    </div>,
  );
}

export default FreelancerDashboard;

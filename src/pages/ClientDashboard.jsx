import React, { useState, useEffect } from 'react';
import { BriefcaseBusiness, CircleDollarSign, ClipboardCheck, Eye, MessageSquareMore, Search, Shield, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import { chatThreads, contracts, disputes, freelancerProfiles, sidebarItems } from '../data/mockData';

const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
const labels = {
  Dashboard: 'Dashboard',
  Jobs: 'Jobs',
  Contracts: 'Contracts',
  Chat: 'Chat',
  'Bank Account': 'Bank Account',
  Payments: 'Payments',
  Disputes: 'Disputes',
  workspace: 'Workspace',
  trustCenter: 'Client Console',
  workspaceDesc: 'Manage hiring, approvals, escrow funding, and disputes from one client command center.',
  balanceProtected: 'Protected budget',
  balanceDesc: 'Reserved across your active supplier contracts.',
};
const titles = {
  dashboard: 'Client Dashboard',
  marketplace: 'Talent Marketplace',
  contracts: 'Client Contracts',
  chat: 'Client Chat',
  bank: 'Bank Account',
  escrow: 'Escrow Control',
  disputes: 'Disputes',
  settings: 'Settings',
};
const clientActivities = [
  { title: 'Proposal shortlist updated', description: '3 freelancers were moved to the final review stage for the dashboard redesign role.', time: '20 minutes ago', icon: Users },
  { title: 'Milestone awaiting approval', description: 'Prototype & Animations was submitted and is waiting for your review.', time: '2 hours ago', icon: ClipboardCheck },
  { title: 'Escrow funded successfully', description: 'A new milestone deposit was confirmed for the mobile app design contract.', time: 'Yesterday', icon: Shield },
];

function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [escrowBalance, setEscrowBalance] = useState(18400);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id ?? 1);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('fptp_token');
        if (!token) return;
        const res = await fetch('/api/escrow/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.summary && data.summary.escrowBalance !== undefined) {
          setEscrowBalance(data.summary.escrowBalance);
        }
      } catch (err) {
        console.error('Failed to fetch escrow summary:', err);
      }
    };
    fetchSummary();
  }, []);

  const selectedContract = contracts.find((item) => item.id === selectedContractId) ?? contracts[0];

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

  const releasePayment = async () => {
    const releaseAmount = 800; // Mock release amount matching backend
    try {
      const token = localStorage.getItem('fptp_token');
      await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contractId: selectedContract.id, milestoneId: 'mock-milestone-id' })
      });
    } catch (err) {
      console.error('API call failed, proceeding with UI mock update:', err);
    }
    setEscrowBalance((prev) => prev - releaseAmount);
  };

  const createDeposit = async () => {
    const depositAmount = 2200;
    try {
      const token = localStorage.getItem('fptp_token');
      await fetch('/api/escrow/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contractId: selectedContract?.id || 'mock', milestoneId: 'mock', amount: depositAmount })
      });
    } catch (err) {
      console.error('API call failed, proceeding with UI mock update:', err);
    }
    setEscrowBalance((prev) => prev + depositAmount);
  };

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={titles[activePage]}
            subtitle="Client workspace for approvals, protected payments, and supplier management"
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
            copy={{ role: 'client', logout: 'Logout' }}
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
    const list = freelancerProfiles.filter((item) => {
      const target = `${item.fullName} ${item.headline} ${item.specialty} ${item.skills.join(' ')}`.toLowerCase();
      return target.includes(query.toLowerCase());
    });
    return dashboardLayout(
      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="muted">Talent Marketplace</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Freelancer profiles ready for client review</h2>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search talent or briefs" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-60" />
            </label>
          </div>
        </SectionCard>
        <div className="grid gap-5 xl:grid-cols-2">
          {list.map((item) => (
            <JobCard
              key={item.id}
              job={{
                title: item.fullName,
                budget: item.hourlyRate,
                client: `${item.rating} rating · ${item.completedJobs} jobs`,
                category: item.specialty,
                description: item.headline,
              }}
              labels={{ budget: 'Rate', client: 'Track record' }}
              actionLabel="View Profile"
              onAction={() => navigate(`/freelancer-profile/${item.id}`)}
            />
          ))}
        </div>
        {list.length === 0 ? (
          <SectionCard className="p-8">
            <p className="muted">No matches found</p>
            <h3 className="mt-2 text-xl font-bold text-ink">Try a different search keyword</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              We could not find a freelancer matching that skill or specialty in the current shortlist. Try searching by role, tool, or expertise area.
            </p>
          </SectionCard>
        ) : null}
      </div>,
    );
  }

  if (activePage === 'contracts') {
    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Client contracts</h2>
          <p className="mt-2 text-sm text-slate-500">{contracts.length} supplier agreements under your review</p>
        </div>
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {contracts.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(contract.id)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${contract.id === selectedContract.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-xl font-semibold text-ink">{contract.title.en}</p>
                <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <SectionCard className="p-6">
            <h3 className="text-2xl font-bold text-ink">{selectedContract.title.en}</h3>
            <p className="mt-2 text-slate-500">{selectedContract.client}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div><p className="text-sm text-slate-500">Approved budget</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.budget}</p></div>
              <div><p className="text-sm text-slate-500">Released so far</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedContract.earned}</p></div>
              <div><p className="text-sm text-slate-500">Progress</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.progress}%</p></div>
            </div>
            <div className="mt-8 space-y-4">
              {selectedContract.milestones.map((milestone) => (
                <div key={milestone.title.en} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-ink">{milestone.title.en}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{milestone.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Due {milestone.dueDate} · {milestone.amount}</p>
                      <p className="mt-2 text-sm text-slate-500">{milestone.reviewNote}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {milestone.reviewAction ? (
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600">
                          <Eye className="h-4 w-4" />
                          {milestone.reviewAction}
                        </button>
                      ) : null}
                      {(milestone.action === 'Approve' || milestone.reviewAction === 'Review Product') ? (
                        <button className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                          <MessageSquareMore className="h-4 w-4" />
                          Review Product
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>,
    );
  }

  if (activePage === 'escrow') {
    return dashboardLayout(
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard className="p-6">
          <p className="muted">Escrow Control</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Protected client budget</h2>
          <div className="mt-6 rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm text-white/70">Reserved project budget</p>
            <p className="mt-2 text-4xl font-bold">${escrowBalance.toLocaleString()}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={releasePayment} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink">Release payment</button>
              <button onClick={createDeposit} className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">Create deposit</button>
            </div>
          </div>
        </SectionCard>
        <SectionCard className="p-6">
          <p className="muted">Escrow actions</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Upcoming approvals and releases</h2>
          <div className="mt-6 space-y-4">
            {['Approve prototype milestone', 'Review final dashboard handoff', 'Release next escrow installment'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SectionCard>
      </div>,
    );
  }

  if (activePage === 'chat') {
    return dashboardLayout(
      <ChatPanel
        userRole="client"
        userName={user?.fullName || user?.email || 'Client'}
        threads={chatThreads.map((thread) => ({
          ...thread,
          participantRole: 'Freelancer',
          participant: thread.messages.find((message) => message.senderRole === 'freelancer')?.senderName || thread.participant,
        }))}
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
      <SectionCard className="p-6">
        <p className="muted">Disputes</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Client dispute overview</h2>
        <div className="mt-6 space-y-4">
          {disputes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{item.title.en}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.contract.en} · {item.amount}</p>
            </div>
          ))}
        </div>
      </SectionCard>,
    );
  }

  if (activePage === 'settings') {
    return dashboardLayout(
      <SettingsPanel user={user} onUserChange={setUser} initialSection={settingsSection} />,
    );
  }

  return dashboardLayout(
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Client Command Center</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Manage hiring, approvals, and escrow releases</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">Review incoming work, approve milestones, track protected budget, and keep every contract under control from one client workspace.</p>
            <div className="mt-6 flex flex-wrap gap-3">
               <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">Add Job</button>
               <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Review Proposals</button>
               <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Fund Escrow</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Pending approvals</p><p className="mt-2 text-3xl font-bold text-ink">3</p><p className="mt-2 text-sm text-slate-500">Milestones waiting for your review this week.</p></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Protected budget</p><p className="mt-2 text-3xl font-bold text-ink">${escrowBalance.toLocaleString()}</p><p className="mt-2 text-sm text-slate-500">Reserved in escrow across active supplier contracts.</p><button onClick={() => setActivePage('escrow')} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Pay milestone</button></div>
            </div>
          </div>
        </div>
      </SectionCard>
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { label: 'Open jobs', value: '12', hint: '4 new proposals today', icon: BriefcaseBusiness, accent: 'bg-pine/10 text-pine' },
          { label: 'Pending approvals', value: '3', hint: 'Milestones waiting for review', icon: ClipboardCheck, accent: 'bg-coral/10 text-coral' },
          { label: 'Protected spend', value: escrowBalance > 0 ? `$${escrowBalance.toLocaleString()}` : '$0', hint: '$6,200 currently held in escrow', icon: CircleDollarSign, accent: 'bg-gold/10 text-gold' },
        ].map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <SectionCard className="p-6">
        <div><p className="muted">Client activity</p><h2 className="mt-1 text-xl font-bold text-ink">Hiring and approval overview</h2></div>
        <div className="mt-6 space-y-4">
          {clientActivities.map((activity) => <div key={activity.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div><div className="flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">{activity.title}</h3><span className="text-sm text-slate-400">{activity.time}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{activity.description}</p></div></div>)}
        </div>
      </SectionCard>
      <SectionCard className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="muted">Featured freelancers</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Open a freelancer profile from here</h2>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('marketplace')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Open Talent Marketplace
          </button>
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {freelancerProfiles.slice(0, 2).map((profile) => (
            <div key={profile.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="chip">{profile.specialty}</span>
                  <h3 className="mt-4 text-xl font-semibold text-ink">{profile.fullName}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{profile.headline}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/freelancer-profile/${profile.id}`)}
                  className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Profile
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Rate</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{profile.hourlyRate}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Rating</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{profile.rating} / 5</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Jobs</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{profile.completedJobs}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>,
  );
}

export default ClientDashboard;

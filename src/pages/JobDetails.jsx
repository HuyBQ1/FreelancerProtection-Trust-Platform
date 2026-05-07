import { ArrowLeft, BriefcaseBusiness, Clock3, MapPin, PencilLine, Shield, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/appData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

function JobDetails() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [acceptStatus, setAcceptStatus] = useState({ type: '', message: '' });
  const role = user?.role === 'client' ? 'client' : 'freelancer';
  const dashboardPath = role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';
  const trustCenter = role === 'client' ? 'Client Console' : 'Trust Center';
  const subtitle = role === 'client'
    ? 'Client-side job overview for reviewing your posted brief'
    : 'Freelancer-side job overview for reviewing opportunity details';
  const labels = {
    Dashboard: 'Dashboard',
    Jobs: 'Jobs',
    Contracts: 'Contracts',
    Chat: 'Chat',
    'Bank Account': 'Bank Account',
    Payments: 'Payments',
    Disputes: 'Disputes',
    workspace: 'Workspace',
    trustCenter,
    workspaceDesc: role === 'client'
      ? 'Manage hiring, approvals, escrow funding, and disputes from one client command center.'
      : 'Manage jobs, contracts, payments, and disputes in one place.',
    balanceProtected: role === 'client' ? 'Protected budget' : 'Protected balance',
    balanceDesc: role === 'client'
      ? 'Reserved across your active supplier contracts.'
      : 'Held across 8 active escrow contracts.',
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const endpoint = role === 'client' && token ? `${API_BASE_URL}/jobs/mine` : `${API_BASE_URL}/jobs`;
        const headers = role === 'client' && token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setJobList([]);
          return;
        }

        const apiJobs = Array.isArray(data.jobs) ? data.jobs : [];
        setJobList(apiJobs);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [role]);

  const selectedJob = useMemo(
    () => jobList.find((job) => String(job.id) === String(jobId) || String(job.title) === String(jobId)) ?? null,
    [jobId, jobList],
  );

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

  const handleContact = async () => {
    if (!selectedJob) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/login');
      return;
    }

    const payload = role === 'client'
      ? {
        counterpartyId: selectedJob.assignedFreelancerId || undefined,
        counterpartyRole: selectedJob.assignedFreelancerRole || 'freelancer',
        contract: selectedJob.title,
        jobId: selectedJob.id,
      }
      : {
        counterpartyId: selectedJob.clientId || undefined,
        counterpartyRole: 'client',
        contract: selectedJob.title,
        jobId: selectedJob.id,
      };

    setContacting(true);
    setContactStatus({ type: '', message: '' });
    setAcceptStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/chat/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Could not open the contact thread.');
      }

      navigate(dashboardPath, {
        state: {
          initialPage: 'chat',
          initialThreadId: data.thread?.id || '',
        },
      });
    } catch (error) {
      setContactStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not open the contact thread.',
      });
    } finally {
      setContacting(false);
    }
  };

  const canContact = role === 'freelancer'
    ? Boolean(selectedJob?.client)
    : Boolean(selectedJob?.assignedFreelancerId || selectedJob?.assignedFreelancerName || selectedJob?.assignedFreelancerRole);
  const canEditJob = role === 'client' && String(selectedJob?.clientId || '') === String(user?.id || '');

  const handleAcceptJob = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !selectedJob?.id) {
      navigate('/login');
      return;
    }

    setContactStatus({ type: '', message: '' });
    setAcceptStatus({ type: '', message: '' });
    setContacting(false);

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${selectedJob.id}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not accept the job.');
      }

      navigate('/freelancer-dashboard', {
        state: {
          initialPage: 'contracts',
          initialContractId: `job-contract-${data.job?.id || selectedJob.id}`,
          acceptedJob: data.job || null,
        },
      });
    } catch (error) {
      setAcceptStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not accept the job.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={(page) => navigate(dashboardPath, { state: { initialPage: page } })} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title="Job Overview"
            subtitle={subtitle}
            onLogout={logout}
            onOpenSettings={() => navigate(dashboardPath, { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate(dashboardPath, { state: { initialPage: 'bank' } })}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role, logout: 'Logout' }}
            user={user}
          />

          <button
            type="button"
            onClick={() => navigate(dashboardPath, { state: { initialPage: 'marketplace' } })}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>

          {loading ? (
            <SectionCard className="p-6">
              <p className="muted">Loading job</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Fetching overview...</h2>
            </SectionCard>
          ) : !selectedJob ? (
            <SectionCard className="p-6">
              <p className="muted">Job not found</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">We could not find that job anymore</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This job may have been removed, or the app is currently showing a different data source.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              <SectionCard className="overflow-hidden p-0">
                <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="bg-ink p-6 text-white sm:p-8">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      {selectedJob.category}
                    </span>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight">{selectedJob.title}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
                      {selectedJob.scopeSummary || selectedJob.description}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Budget</p>
                        <p className="mt-2 text-xl font-semibold">{selectedJob.budget}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Level</p>
                        <p className="mt-2 text-xl font-semibold">{selectedJob.experienceLevel || 'Open level'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Timeline</p>
                        <p className="mt-2 text-xl font-semibold">{selectedJob.timeline || 'Flexible'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Client</p>
                        <p className="mt-2 text-xl font-semibold">{selectedJob.client}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 sm:p-8">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><UserRound className="h-4 w-4 text-pine" />Client</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedJob.client}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><Wallet className="h-4 w-4 text-pine" />Engagement</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedJob.engagementType || 'Flexible'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><MapPin className="h-4 w-4 text-pine" />Location</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedJob.locationType || 'Remote'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><Clock3 className="h-4 w-4 text-pine" />Status</p>
                        <p className="mt-2 text-lg font-semibold capitalize text-ink">{selectedJob.status || 'open'}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {canEditJob ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/client-jobs/${selectedJob.id}/edit`)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit Job Post
                        </button>
                      ) : null}
                      {canContact ? (
                        <button
                          type="button"
                          onClick={handleContact}
                          disabled={contacting}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {contacting ? 'Opening chat...' : role === 'client' ? 'Contact freelancer' : 'Contact client'}
                        </button>
                      ) : null}
                      {role === 'freelancer' ? (
                        <button
                          type="button"
                          onClick={handleAcceptJob}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Accept Job
                        </button>
                      ) : null}
                    </div>
                    {contactStatus.message ? (
                      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${contactStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {contactStatus.message}
                      </p>
                    ) : null}
                    {acceptStatus.message ? (
                      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${acceptStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {acceptStatus.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SectionCard className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="muted">Full brief</p>
                      <h2 className="text-2xl font-bold text-ink">Project description</h2>
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-8 text-slate-600">{selectedJob.description}</p>
                </SectionCard>

                <div className="space-y-6">
                  <SectionCard className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="muted">Skill fit</p>
                        <h2 className="text-2xl font-bold text-ink">Required skills</h2>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {(selectedJob.skills?.length ? selectedJob.skills : ['Strong communication', 'Reliable delivery']).map((skill) => (
                        <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6">
                    <p className="muted">Summary</p>
                    <h2 className="mt-1 text-2xl font-bold text-ink">Quick overview</h2>
                    <div className="mt-6 space-y-3">
                      {[
                        `Category: ${selectedJob.category}`,
                        `Budget: ${selectedJob.budget}`,
                        `Timeline: ${selectedJob.timeline || 'Flexible'}`,
                        `Location: ${selectedJob.locationType || 'Remote'}`,
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          {item}
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {selectedJob.milestones?.length ? (
                    <SectionCard className="p-6">
                      <p className="muted">Payment plan</p>
                      <h2 className="mt-1 text-2xl font-bold text-ink">Milestones</h2>
                      <div className="mt-6 space-y-3">
                        {selectedJob.milestones.map((milestone, index) => (
                          <div key={`${milestone.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-semibold text-ink">{milestone.title}</p>
                              <span className="text-sm font-semibold text-slate-700">{milestone.amount}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">{milestone.dueDate || 'Flexible due date'}</p>
                            {milestone.description ? (
                              <p className="mt-2 text-sm leading-6 text-slate-500">{milestone.description}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetails;

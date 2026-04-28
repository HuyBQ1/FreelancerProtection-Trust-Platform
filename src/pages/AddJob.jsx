import { ArrowLeft, BriefcaseBusiness, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'fptp_token';
const LOCAL_CLIENT_JOBS_KEY = 'fptp_client_jobs';

const jobCategories = ['Design', 'Development', 'Security', 'Legal'];
const experienceLevels = ['Entry', 'Intermediate', 'Senior', 'Expert'];
const engagementTypes = ['Fixed price', 'Hourly', 'Retainer'];
const locationTypes = ['Remote', 'Hybrid', 'On-site'];

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

function isMockToken(token) {
  return typeof token === 'string' && token.startsWith('mock-');
}

function readLocalJobs() {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENT_JOBS_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalJobs(jobs) {
  localStorage.setItem(LOCAL_CLIENT_JOBS_KEY, JSON.stringify(jobs));
}

function AddJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [jobSaving, setJobSaving] = useState(false);
  const [jobStatus, setJobStatus] = useState({ type: '', message: '' });
  const [jobForm, setJobForm] = useState({
    title: '',
    category: 'Design',
    budget: '',
    experienceLevel: 'Senior',
    timeline: '',
    locationType: 'Remote',
    engagementType: 'Fixed price',
    scopeSummary: '',
    skills: '',
    description: '',
  });

  const quickTips = useMemo(
    () => [
      'Be specific about deliverables and approval criteria.',
      'List the tools or stack you expect the freelancer to use.',
      'Include timeline and communication expectations up front.',
    ],
    [],
  );
  const previewChips = useMemo(
    () => [
      jobForm.experienceLevel || 'Senior',
      jobForm.engagementType || 'Fixed price',
      jobForm.locationType || 'Remote',
      jobForm.timeline || 'Flexible timeline',
    ],
    [jobForm.engagementType, jobForm.experienceLevel, jobForm.locationType, jobForm.timeline],
  );

  const updateJobField = (field, value) => {
    setJobForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setJobForm({
      title: '',
      category: 'Design',
      budget: '',
      experienceLevel: 'Senior',
      timeline: '',
      locationType: 'Remote',
      engagementType: 'Fixed price',
      scopeSummary: '',
      skills: '',
      description: '',
    });
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

  const logout = () => {
    localStorage.removeItem('fptp_token');
    localStorage.removeItem('fptp_user');
    navigate('/login', { replace: true });
  };

  const routeToClientDashboard = (page) => {
    navigate('/client-dashboard', { state: { initialPage: page } });
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setJobStatus({ type: '', message: '' });

    if (!jobForm.title.trim() || !jobForm.description.trim() || !jobForm.category.trim() || !jobForm.budget.trim()) {
      setJobStatus({ type: 'error', message: 'Please complete title, category, budget, and description.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const nextLocalJob = {
      id: `local-job-${Date.now()}`,
      title: jobForm.title.trim(),
      category: jobForm.category.trim(),
      budget: jobForm.budget.trim(),
      experienceLevel: jobForm.experienceLevel.trim(),
      timeline: jobForm.timeline.trim(),
      locationType: jobForm.locationType.trim(),
      engagementType: jobForm.engagementType.trim(),
      scopeSummary: jobForm.scopeSummary.trim(),
      skills: jobForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      description: jobForm.description.trim(),
      client: user?.companyName || user?.fullName || user?.email || 'Client',
      status: 'open',
      source: 'local',
    };

    if (!token || isMockToken(token)) {
      const nextJobs = [nextLocalJob, ...readLocalJobs()];
      writeLocalJobs(nextJobs);
      resetForm();
      navigate('/client-dashboard', {
        state: {
          initialPage: 'marketplace',
          jobStatus: {
            type: 'success',
            message: 'Job created in demo mode and added to your job list.',
          },
        },
      });
      return;
    }

    setJobSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobForm),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Could not create job.');
      }

      const createdJob = data.job ? [data.job, ...readLocalJobs().filter((job) => job.id !== data.job.id)] : readLocalJobs();
      writeLocalJobs(createdJob);
      resetForm();

      navigate('/client-dashboard', {
        state: {
          initialPage: 'marketplace',
          jobStatus: {
            type: 'success',
            message: 'Job created successfully.',
          },
        },
      });
    } catch (error) {
      setJobStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not create job.',
      });
    } finally {
      setJobSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={routeToClientDashboard} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title="Add Job"
            subtitle="Create a dedicated hiring brief for your client workspace"
            onLogout={logout}
            onOpenSettings={() => routeToClientDashboard('settings')}
            onOpenBankSettings={() => routeToClientDashboard('bank')}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'client', logout: 'Logout' }}
            user={user}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => routeToClientDashboard('marketplace')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </button>
          </div>

          <SectionCard className="overflow-hidden p-0">
            <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden bg-ink p-6 text-white sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.18),transparent_34%)]" />
                <div className="relative">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Client hiring brief
                  </span>
                  <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight">Create a richer job post for freelancers</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
                    Turn a vague request into a serious brief with budget, scope, skills, and delivery expectations that good freelancers can trust.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Clarity</p>
                      <p className="mt-2 text-lg font-semibold">Scope that is easy to price</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Trust</p>
                      <p className="mt-2 text-lg font-semibold">Expectations that reduce rework</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Quality</p>
                      <p className="mt-2 text-lg font-semibold">Better proposals from better people</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="muted">Quick guide</p>
                    <h2 className="text-2xl font-bold text-ink">What strong briefs include</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {quickTips.map((tip) => (
                    <div key={tip} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="muted">New post</p>
                  <h2 className="text-2xl font-bold text-ink">Job details</h2>
                </div>
              </div>

              <form onSubmit={handleCreateJob} className="mt-8 space-y-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Core details</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Job title</span>
                      <input value={jobForm.title} onChange={(event) => updateJobField('title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Senior React engineer for escrow dashboard" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Category</span>
                      <select value={jobForm.category} onChange={(event) => updateJobField('category', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {jobCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Budget and fit</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Budget</span>
                      <input value={jobForm.budget} onChange={(event) => updateJobField('budget', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="$3,500 - $5,000" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Experience level</span>
                      <select value={jobForm.experienceLevel} onChange={(event) => updateJobField('experienceLevel', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {experienceLevels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Engagement</span>
                      <select value={jobForm.engagementType} onChange={(event) => updateJobField('engagementType', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {engagementTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Location</span>
                      <select value={jobForm.locationType} onChange={(event) => updateJobField('locationType', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {locationTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Scope and delivery</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Timeline</span>
                      <input value={jobForm.timeline} onChange={(event) => updateJobField('timeline', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="2 to 4 weeks" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Required skills</span>
                      <input value={jobForm.skills} onChange={(event) => updateJobField('skills', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="React, Tailwind, Dashboard UX" />
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Scope summary</span>
                    <input value={jobForm.scopeSummary} onChange={(event) => updateJobField('scopeSummary', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Build a secure client portal with milestone review and payout controls." />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Description</span>
                    <textarea value={jobForm.description} onChange={(event) => updateJobField('description', event.target.value)} rows={7} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Describe the role, scope, deliverables, and the kind of freelancer you want to hire." />
                  </label>
                </div>

                {jobStatus.message ? (
                  <p className={`rounded-2xl px-4 py-3 text-sm ${jobStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {jobStatus.message}
                  </p>
                ) : null}

                <button type="submit" disabled={jobSaving} className="inline-flex items-center gap-2 rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {jobSaving ? 'Creating...' : 'Create Job'}
                </button>
              </form>
            </SectionCard>

            <div className="space-y-6 xl:sticky xl:top-4">
              <SectionCard className="overflow-hidden p-0">
                <div className="bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#0f766e_100%)] p-6 text-white sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Live preview</p>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">
                    {jobForm.title.trim() || 'Your job title will appear here'}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    {jobForm.scopeSummary.trim() || 'A short scope summary helps freelancers understand the opportunity before opening the full brief.'}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Budget</p>
                      <p className="mt-2 text-lg font-semibold">{jobForm.budget.trim() || 'Set a budget'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Category</p>
                      <p className="mt-2 text-lg font-semibold">{jobForm.category}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {previewChips.map((chip) => (
                      <span key={chip} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Why this helps</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">Better matching</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Good freelancers can tell quickly whether they fit the role.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">Cleaner proposals</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">A better brief usually means fewer vague replies and less back-and-forth.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">Stronger trust</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Clarity around scope and budget makes the project feel more serious and safer to accept.</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddJob;

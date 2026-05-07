import { ArrowLeft, BriefcaseBusiness, Plus, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/appData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

const jobCategories = ['Design', 'Development', 'Security', 'Legal'];
const experienceLevels = ['Entry', 'Intermediate', 'Senior', 'Expert'];
const engagementTypes = ['Fixed price', 'Hourly', 'Retainer'];
const locationTypes = ['Remote', 'Hybrid', 'On-site'];

const defaultJobForm = {
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
  milestones: [
    { title: 'Kickoff and scope alignment', amount: '', dueDate: '', description: '' },
    { title: 'Final delivery and approval', amount: '', dueDate: '', description: '' },
  ],
};

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

function AddJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [jobSaving, setJobSaving] = useState(false);
  const [jobLoading, setJobLoading] = useState(isEditMode);
  const [jobStatus, setJobStatus] = useState({ type: '', message: '' });
  const [jobForm, setJobForm] = useState(defaultJobForm);

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
    setJobForm(defaultJobForm);
  };

  useEffect(() => {
    if (!isEditMode) {
      setJobLoading(false);
      return;
    }

    const fetchJobForEdit = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      setJobLoading(true);
      setJobStatus({ type: '', message: '' });

      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Could not load this job post.');
        }

        const job = data.job || {};
        setJobForm({
          title: job.title || '',
          category: job.category || 'Design',
          budget: job.budget || '',
          experienceLevel: job.experienceLevel || 'Senior',
          timeline: job.timeline || '',
          locationType: job.locationType || 'Remote',
          engagementType: job.engagementType || 'Fixed price',
          scopeSummary: job.scopeSummary || '',
          skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
          description: job.description || '',
          milestones: Array.isArray(job.milestones) && job.milestones.length > 0
            ? job.milestones.map((milestone) => ({
              title: milestone.title || '',
              amount: milestone.amount || '',
              dueDate: milestone.dueDate || '',
              description: milestone.description || '',
            }))
            : defaultJobForm.milestones,
        });
      } catch (error) {
        setJobStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Could not load this job post.',
        });
      } finally {
        setJobLoading(false);
      }
    };

    fetchJobForEdit();
  }, [isEditMode, jobId, navigate]);

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

    const normalizedMilestones = jobForm.milestones
      .map((milestone) => ({
        title: milestone.title.trim(),
        amount: milestone.amount.trim(),
        dueDate: milestone.dueDate.trim(),
        description: milestone.description.trim(),
      }))
      .filter((milestone) => milestone.title && milestone.amount);

    if (normalizedMilestones.length === 0) {
      setJobStatus({ type: 'error', message: 'Please add at least one milestone with a title and payment amount.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setJobSaving(true);

    try {
      const res = await fetch(isEditMode ? `${API_BASE_URL}/jobs/${jobId}` : `${API_BASE_URL}/jobs`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...jobForm,
          milestones: normalizedMilestones,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Could not create job.');
      }

      if (!isEditMode) {
        resetForm();
      }

      navigate('/client-dashboard', {
        state: {
          initialPage: 'marketplace',
          jobStatus: {
            type: 'success',
            message: isEditMode ? 'Job post updated successfully.' : 'Job created successfully.',
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

  const updateMilestoneField = (index, field, value) => {
    setJobForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) => (
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone
      )),
    }));
  };

  const addMilestone = () => {
    setJobForm((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        { title: '', amount: '', dueDate: '', description: '' },
      ],
    }));
  };

  const removeMilestone = (index) => {
    setJobForm((current) => ({
      ...current,
      milestones: current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={routeToClientDashboard} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={isEditMode ? 'Edit Job' : 'Add Job'}
            subtitle={isEditMode ? 'Update your hiring brief after negotiation' : 'Create a dedicated hiring brief for your client workspace'}
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
                    {isEditMode ? 'Client brief editor' : 'Client hiring brief'}
                  </span>
                  <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight">
                    {isEditMode ? 'Edit your job post after the deal discussion' : 'Create a richer job post for freelancers'}
                  </h1>
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

              {jobLoading ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                  Loading job post from database...
                </div>
              ) : (
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Milestones</p>
                      <p className="mt-1 text-sm text-slate-500">Define payment stages so freelancers know exactly how delivery and approval will work.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add milestone
                    </button>
                  </div>
                  <div className="space-y-4">
                    {jobForm.milestones.map((milestone, index) => (
                      <div key={`milestone-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">Milestone {index + 1}</p>
                          {jobForm.milestones.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Milestone title</span>
                            <input
                              value={milestone.title}
                              onChange={(event) => updateMilestoneField(index, 'title', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="Discovery and wireframes"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Payment amount</span>
                            <input
                              value={milestone.amount}
                              onChange={(event) => updateMilestoneField(index, 'amount', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="$1,200"
                            />
                          </label>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Due date</span>
                            <input
                              value={milestone.dueDate}
                              onChange={(event) => updateMilestoneField(index, 'dueDate', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="May 20, 2026"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Approval note</span>
                            <input
                              value={milestone.description}
                              onChange={(event) => updateMilestoneField(index, 'description', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="What should be reviewed at this stage?"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {jobStatus.message ? (
                  <p className={`rounded-2xl px-4 py-3 text-sm ${jobStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {jobStatus.message}
                  </p>
                ) : null}

                <button type="submit" disabled={jobSaving} className="inline-flex items-center gap-2 rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {jobSaving ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Job Changes' : 'Create Job')}
                </button>
              </form>
              )}
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

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Milestone plan</p>
                    {jobForm.milestones
                      .filter((milestone) => milestone.title.trim() || milestone.amount.trim())
                      .map((milestone, index) => (
                        <div key={`preview-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{milestone.title.trim() || `Milestone ${index + 1}`}</p>
                            <span className="text-xs font-semibold text-white/70">{milestone.amount.trim() || 'Set amount'}</span>
                          </div>
                          <p className="mt-2 text-xs leading-6 text-white/70">{milestone.description.trim() || milestone.dueDate.trim() || 'Add a due date or approval note for this stage.'}</p>
                        </div>
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

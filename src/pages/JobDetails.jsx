import { ArrowLeft, BriefcaseBusiness, CircleCheckBig, Clock3, MapPin, PencilLine, Shield, Star, UserRound, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/appData';
import { persistLanguage } from '../utils/language';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

function JobDetails() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [acceptStatus, setAcceptStatus] = useState({ type: '', message: '' });
  const [proposalStatus, setProposalStatus] = useState({ type: '', message: '' });
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [selectingProposalId, setSelectingProposalId] = useState('');
  const [proposalSelectionDraft, setProposalSelectionDraft] = useState(null);
  const [proposalForm, setProposalForm] = useState({ bidAmount: '', timeline: '', coverLetter: '' });
  const [proposalRatings, setProposalRatings] = useState({});
  const [ownRatingSummary, setOwnRatingSummary] = useState(null);

  const role = user?.role === 'client' ? 'client' : 'freelancer';
  const language = user?.settings?.language || 'en';
  const isVietnamese = language === 'vi';
  const dashboardPath = role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';

  const trustCenter = isVietnamese
    ? (role === 'client' ? 'Bảng điều khiển khách hàng' : 'Trung tâm tin cậy')
    : (role === 'client' ? 'Client Console' : 'Trust Center');

  const subtitle = isVietnamese
    ? (role === 'client'
      ? 'Xem lại brief công việc, đề xuất từ freelancer và quyết định người đồng hành phù hợp.'
      : 'Xem nhanh brief công việc, gửi chào giá và quyết định có nhận cơ hội này hay không.')
    : (role === 'client'
      ? 'Review the job brief, freelancer proposals, and choose the right partner.'
      : 'Review the brief, submit your proposal, and decide whether to take this opportunity.');

  const labels = {
    Dashboard: isVietnamese ? 'Tổng quan' : 'Dashboard',
    Jobs: isVietnamese ? 'Công việc' : 'Jobs',
    Contracts: isVietnamese ? 'Hợp đồng' : 'Contracts',
    Chat: isVietnamese ? 'Trò chuyện' : 'Chat',
    'Bank Account': isVietnamese ? 'Tài khoản ngân hàng' : 'Bank Account',
    Payments: isVietnamese ? 'Thanh toán' : 'Payments',
    Disputes: isVietnamese ? 'Tranh chấp' : 'Disputes',
    workspace: isVietnamese ? 'Không gian làm việc' : 'Workspace',
    trustCenter,
    workspaceDesc: isVietnamese
      ? (role === 'client'
        ? 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.'
        : 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.')
      : (role === 'client'
        ? 'Manage hiring, approvals, payments, and disputes from one client command center.'
        : 'Manage jobs, contracts, payments, and disputes in one place.'),
    balanceProtected: isVietnamese ? 'Số dư khả dụng' : (role === 'client' ? 'Available balance' : 'Available balance'),
    balanceDesc: isVietnamese
      ? 'Dùng chung cho thanh toán và rút tiền trên nền tảng.'
      : 'Shared balance for payouts and platform payments.',
  };

  const fetchJob = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSelectedJob(null);
        return;
      }

      setSelectedJob(data.job || null);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    const loadProposalRatings = async () => {
      if (!selectedJob?.proposals?.length) {
        setProposalRatings({});
        return;
      }

      const entries = await Promise.all(
        selectedJob.proposals.map(async (proposal) => {
          try {
            const response = await fetch(`${API_BASE_URL}/reviews/rating/${proposal.freelancerId}`);
            if (!response.ok) {
              return [proposal.freelancerId, { averageRating: 0, totalReviews: 0 }];
            }
            const data = await response.json();
            return [proposal.freelancerId, data];
          } catch {
            return [proposal.freelancerId, { averageRating: 0, totalReviews: 0 }];
          }
        }),
      );

      setProposalRatings(Object.fromEntries(entries));
    };

    loadProposalRatings();
  }, [selectedJob]);

  useEffect(() => {
    const loadOwnRating = async () => {
      if (role !== 'freelancer' || !(user?.id || user?._id)) {
        setOwnRatingSummary(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/reviews/rating/${user?.id || user?._id}`);
        if (!response.ok) {
          setOwnRatingSummary({ averageRating: 0, totalReviews: 0 });
          return;
        }
        const data = await response.json();
        setOwnRatingSummary(data);
      } catch {
        setOwnRatingSummary({ averageRating: 0, totalReviews: 0 });
      }
    };

    loadOwnRating();
  }, [role, user]);

  const myProposal = useMemo(
    () => selectedJob?.proposals?.find((proposal) => String(proposal.freelancerId) === String(user?.id || user?._id || '')) || null,
    [selectedJob, user],
  );

  useEffect(() => {
    if (!myProposal) return;
    setProposalForm({
      bidAmount: myProposal.bidAmount ? `${myProposal.bidAmount}` : '',
      timeline: myProposal.timeline || '',
      coverLetter: myProposal.coverLetter || '',
    });
  }, [myProposal]);

  const logout = () => {
    localStorage.removeItem('fptp_token');
    localStorage.removeItem('fptp_user');
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = (nextLanguage) => {
    persistLanguage(nextLanguage);
    const nextUser = {
      ...user,
      settings: {
        ...user?.settings,
        language: nextLanguage,
      },
    };

    setUser(nextUser);
    localStorage.setItem('fptp_user', JSON.stringify(nextUser));
  };

  const handleContact = async (counterpartyOverride = null) => {
    if (!selectedJob) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/login');
      return;
    }

    const payload = role === 'client'
      ? {
        counterpartyId: counterpartyOverride?.id || selectedJob.assignedFreelancerId || undefined,
        counterpartyRole: 'freelancer',
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
  const canEditJob = role === 'client' && String(selectedJob?.clientId || '') === String(user?.id || user?._id || '');
  const isJobOwner = canEditJob;

  const handleAcceptJob = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !selectedJob?.id) {
      navigate('/login');
      return;
    }

    setAcceptStatus({ type: '', message: '' });

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

  const handleSubmitProposal = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !selectedJob?.id) {
      navigate('/login');
      return;
    }

    setProposalSubmitting(true);
    setProposalStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${selectedJob.id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(proposalForm),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not submit proposal.');
      }

      setProposalStatus({
        type: 'success',
        message: isVietnamese ? 'Đề xuất đã được gửi thành công.' : 'Proposal submitted successfully.',
      });
      setSelectedJob(data.job || null);
      await fetchJob();
    } catch (error) {
      setProposalStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not submit proposal.',
      });
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleSelectProposal = async (proposalId, milestoneDrafts = null) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !selectedJob?.id) {
      navigate('/login');
      return;
    }

    setSelectingProposalId(proposalId);
    setAcceptStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${selectedJob.id}/proposals/${proposalId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          milestones: Array.isArray(milestoneDrafts) ? milestoneDrafts : [],
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not select proposal.');
      }

      navigate('/client-dashboard', {
        state: {
          initialPage: 'contracts',
          initialContractId: `job-contract-${data.job?.id || selectedJob.id}`,
          acceptedJob: data.job || null,
        },
      });
    } catch (error) {
      setAcceptStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not select proposal.',
      });
    } finally {
      setSelectingProposalId('');
    }
  };

  const openProposalSelectionDraft = (proposal) => {
    if (!proposal) return;
    const fallbackMilestones = selectedJob.milestones?.length
      ? selectedJob.milestones
      : [{ title: isVietnamese ? 'Milestone 1' : 'Milestone 1', amount: selectedJob.budget || '0 VND', dueDate: selectedJob.timeline || '' }];

    setAcceptStatus({ type: '', message: '' });
    setProposalSelectionDraft({
      proposalId: proposal.id,
      freelancerName: proposal.freelancerName || proposal.freelancerEmail || '',
      bidAmount: proposal.bidAmount || 0,
      bidDisplay: proposal.bidDisplay || `${proposal.bidAmount || 0} VND`,
      milestones: fallbackMilestones.map((milestone, index) => ({
        title: milestone.title || `Milestone ${index + 1}`,
        dueDate: milestone.dueDate || proposal.timeline || '',
        description: milestone.description || '',
        amount: '',
      })),
    });
  };

  const draftTotalAmount = (proposalSelectionDraft?.milestones || []).reduce((sum, milestone) => {
    const amount = Number.parseInt(`${milestone.amount || '0'}`, 10);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const draftTotalMatches = proposalSelectionDraft ? draftTotalAmount === (proposalSelectionDraft.bidAmount || 0) : false;

  const topFacts = selectedJob ? [
    {
      label: isVietnamese ? 'Ngân sách' : 'Budget',
      value: selectedJob.budget,
      icon: Wallet,
    },
    {
      label: isVietnamese ? 'Cấp độ' : 'Level',
      value: selectedJob.experienceLevel || (isVietnamese ? 'Linh hoạt' : 'Open level'),
      icon: Shield,
    },
    {
      label: isVietnamese ? 'Thời gian' : 'Timeline',
      value: selectedJob.timeline || (isVietnamese ? 'Linh hoạt' : 'Flexible'),
      icon: Clock3,
    },
    {
      label: isVietnamese ? 'Khách hàng' : 'Client',
      value: selectedJob.client,
      icon: UserRound,
    },
  ] : [];


  const proposalCount = Array.isArray(selectedJob?.proposals) ? selectedJob.proposals.length : 0;
  return (
    <div className="min-h-screen bg-slate-100/80">
      {proposalSelectionDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{isVietnamese ? 'Chia ti\u1ec1n milestone' : 'Milestone payment split'}</p>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                  {isVietnamese ? 'X\u00e1c nh\u1eadn deal v\u1edbi freelancer' : 'Confirm freelancer deal'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {proposalSelectionDraft.freelancerName} • {proposalSelectionDraft.bidDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProposalSelectionDraft(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {isVietnamese ? '\u0110\u00f3ng' : 'Close'}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {proposalSelectionDraft.milestones.map((milestone, index) => (
                <div key={`${milestone.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                      <p className="font-semibold text-ink">{milestone.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{milestone.dueDate || (isVietnamese ? 'Ch\u01b0a c\u00f3 h\u1ea1n' : 'No due date')}</p>
                    </div>
                    <label className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{isVietnamese ? 'S\u1ed1 ti\u1ec1n' : 'Amount'}</span>
                      <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-pine">
                        <input
                          value={milestone.amount}
                          onChange={(event) => {
                            const cleanValue = event.target.value.replace(/\D/g, '');
                            setProposalSelectionDraft((current) => ({
                              ...current,
                              milestones: current.milestones.map((item, itemIndex) => (
                                itemIndex === index ? { ...item, amount: cleanValue } : item
                              )),
                            }));
                          }}
                          placeholder="0"
                          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                        />
                        <span className="flex items-center border-l border-slate-200 px-3 text-xs font-bold text-slate-500">VND</span>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  {isVietnamese ? 'T\u1ed5ng milestone' : 'Milestone total'}: <span className="text-ink">{draftTotalAmount.toLocaleString('vi-VN')} VND</span>
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {isVietnamese ? 'Gi\u00e1 deal' : 'Deal price'}: <span className="text-ink">{proposalSelectionDraft.bidDisplay}</span>
                </p>
              </div>
              {!draftTotalMatches ? (
                <p className="mt-3 text-sm font-medium text-rose-600">
                  {isVietnamese ? 'T\u1ed5ng ti\u1ec1n milestone ph\u1ea3i b\u1eb1ng \u0111\u00fang gi\u00e1 deal c\u1ee7a freelancer.' : 'Milestone total must match the freelancer deal price exactly.'}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProposalSelectionDraft(null)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {isVietnamese ? 'Hu\u1ef7' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!draftTotalMatches || selectingProposalId === proposalSelectionDraft.proposalId}
                onClick={() => handleSelectProposal(proposalSelectionDraft.proposalId, proposalSelectionDraft.milestones)}
                className="rounded-2xl bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {selectingProposalId === proposalSelectionDraft.proposalId
                  ? (isVietnamese ? '\u0110ang x\u00e1c nh\u1eadn...' : 'Confirming...')
                  : (isVietnamese ? 'X\u00e1c nh\u1eadn ch\u1ecdn freelancer' : 'Confirm freelancer')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={(page) => navigate(dashboardPath, { state: { initialPage: page } })} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={isVietnamese ? 'Tổng quan công việc' : 'Job Overview'}
            subtitle={subtitle}
            onLogout={logout}
            onOpenSettings={() => navigate(dashboardPath, { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate(dashboardPath, { state: { initialPage: 'bank' } })}
            language={language}
            onLanguageChange={handleLanguageChange}
            copy={{ role: isVietnamese ? (role === 'client' ? 'khách hàng' : 'freelancer') : role, logout: isVietnamese ? 'Đăng xuất' : 'Logout' }}
            user={user}
          />

          <button
            type="button"
            onClick={() => navigate(dashboardPath, { state: { initialPage: 'marketplace' } })}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {isVietnamese ? 'Quay lại công việc' : 'Back to Jobs'}
          </button>

          {loading ? (
            <SectionCard className="p-6">
              <p className="muted">{isVietnamese ? 'Đang tải công việc' : 'Loading job'}</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">{isVietnamese ? 'Đang lấy dữ liệu tổng quan...' : 'Fetching overview...'}</h2>
            </SectionCard>
          ) : !selectedJob ? (
            <SectionCard className="p-6">
              <p className="muted">{isVietnamese ? 'Không tìm thấy công việc' : 'Job not found'}</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">{isVietnamese ? 'Không thể tìm thấy công việc này nữa' : 'We could not find that job anymore'}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {isVietnamese
                  ? 'Công việc này có thể đã bị xóa, hoặc ứng dụng đang hiển thị từ một nguồn dữ liệu khác.'
                  : 'This job may have been removed, or the app is currently showing a different data source.'}
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              <SectionCard className="overflow-hidden p-0">
                <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="bg-ink p-6 text-white sm:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                        {selectedJob.category}
                      </span>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {selectedJob.status === 'open'
                          ? (isVietnamese ? 'Đang tuyển' : 'Open for proposals')
                          : (selectedJob.status === 'assigned'
                            ? (isVietnamese ? 'Đã chọn freelancer' : 'Freelancer selected')
                            : (isVietnamese ? 'Đã đóng' : 'Closed'))}
                      </span>
                    </div>

                    <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">{selectedJob.title}</h1>
                    <p className="mt-4 max-w-4xl text-base leading-8 text-white/75">
                      {selectedJob.scopeSummary || selectedJob.description}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {topFacts.map((fact) => {
                        const Icon = fact.icon;
                        return (
                          <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
                              <Icon className="h-4 w-4 text-white/70" />
                              {fact.label}
                            </p>
                            <p className="mt-3 text-xl font-semibold">{fact.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white p-6 sm:p-8">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{isVietnamese ? 'Điểm chính' : 'Quick read'}</p>
                        <h2 className="mt-2 text-2xl font-bold text-ink">{isVietnamese ? 'Ra quyết định nhanh hơn' : 'Decide faster'}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {isVietnamese
                            ? 'Khối này gom toàn bộ hành động quan trọng: sửa brief, liên hệ, nhận việc hoặc chọn freelancer phù hợp.'
                            : 'This side keeps the key actions together: edit the brief, contact the other side, accept the job, or select the right freelancer.'}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{isVietnamese ? 'Hình thức' : 'Engagement'}</p>
                          <p className="mt-2 text-lg font-semibold text-ink">{selectedJob.engagementType || (isVietnamese ? 'Linh hoạt' : 'Flexible')}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{isVietnamese ? 'Địa điểm' : 'Location'}</p>
                          <p className="mt-2 text-lg font-semibold text-ink">{selectedJob.locationType || 'Remote'}</p>
                        </div>
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
                          {isVietnamese ? 'Sửa công việc' : 'Edit Job Post'}
                        </button>
                      ) : null}

                      {canContact ? (
                        <button
                          type="button"
                          onClick={() => handleContact()}
                          disabled={contacting}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {contacting
                            ? (isVietnamese ? 'Đang mở trò chuyện...' : 'Opening chat...')
                            : (role === 'client'
                              ? (isVietnamese ? 'Liên hệ freelancer' : 'Contact freelancer')
                              : (isVietnamese ? 'Liên hệ khách hàng' : 'Contact client'))}
                        </button>
                      ) : null}

                      {role === 'freelancer' && selectedJob.status === 'assigned' ? (
                        <button
                          type="button"
                          onClick={handleAcceptJob}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {isVietnamese ? 'Đi tới hợp đồng' : 'Open contract'}
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

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <SectionCard className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="muted">{isVietnamese ? 'Brief \u0111\u1ea7y \u0111\u1ee7' : 'Full brief'}</p>
                        <h2 className="text-2xl font-bold text-ink">{isVietnamese ? 'M\u00f4 t\u1ea3 c\u00f4ng vi\u1ec7c chi ti\u1ebft' : 'Project description'}</h2>
                      </div>
                    </div>
                    <p className="mt-6 text-sm leading-8 text-slate-600">{selectedJob.description}</p>

                    {(role === 'freelancer' && selectedJob.status === 'open') || isJobOwner ? (
                      <div className="mt-8 border-t border-slate-200 pt-6">
                        <div className={`grid gap-8 ${role === 'freelancer' && selectedJob.status === 'open' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]' : 'xl:grid-cols-1'}`}>
                          {role === 'freelancer' && selectedJob.status === 'open' ? (
                          <div>
                            <div className="grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-3">
                              <div className="flex items-center gap-3">
                                <BriefcaseBusiness className="h-5 w-5 text-ink" />
                                <span className="text-sm font-medium text-slate-700">{isVietnamese ? '\u0110ang nh\u1eadn ch\u00e0o gi\u00e1' : 'Open for bidding'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-ink" />
                                <span className="text-sm font-medium text-slate-700">{selectedJob.locationType || (isVietnamese ? 'L\u00e0m vi\u1ec7c t\u1eeb xa' : 'Remote project')}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Clock3 className="h-5 w-5 text-ink" />
                                <span className="text-sm font-medium text-slate-700">{selectedJob.timeline || (isVietnamese ? 'Th\u1eddi gian linh ho\u1ea1t' : 'Flexible timeline')}</span>
                              </div>
                            </div>

                            <h3 className="mt-6 text-xl font-bold text-ink">{isVietnamese ? 'Ch\u00e0o gi\u00e1' : 'Place your bid'}</h3>
                            <form onSubmit={handleSubmitProposal} className="mt-4 grid gap-4">
                              <label className="space-y-2">
                                <span className="text-sm font-semibold text-ink">{isVietnamese ? 'M\u1ee9c ch\u00e0o gi\u00e1' : 'Bid amount'}</span>
                                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-pine">
                                  <span className="flex items-center border-r border-slate-200 px-4 text-sm font-semibold text-slate-500">₫</span>
                                  <input value={proposalForm.bidAmount} onChange={(event) => setProposalForm((current) => ({ ...current, bidAmount: event.target.value }))} placeholder="500000" className="min-w-0 flex-1 px-4 py-3 text-sm outline-none" />
                                  <span className="flex items-center border-l border-slate-200 px-4 text-sm font-semibold text-slate-500">VND</span>
                                </div>
                              </label>

                              <label className="space-y-2">
                                <span className="text-sm font-semibold text-ink">{isVietnamese ? 'Th\u1eddi gian ho\u00e0n th\u00e0nh' : 'Delivery timeframe'}</span>
                                <input value={proposalForm.timeline} onChange={(event) => setProposalForm((current) => ({ ...current, timeline: event.target.value }))} placeholder={isVietnamese ? 'V\u00ed d\u1ee5: 7 ng\u00e0y ho\u1eb7c 2 tu\u1ea7n' : 'Example: 7 days or 2 weeks'} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-pine" />
                              </label>

                              <label className="space-y-2">
                                <span className="text-sm font-semibold text-ink">{isVietnamese ? 'L\u1eddi nh\u1eafn \u0111\u1ec1 xu\u1ea5t' : 'Proposal note'}</span>
                                <textarea value={proposalForm.coverLetter} onChange={(event) => setProposalForm((current) => ({ ...current, coverLetter: event.target.value }))} rows={4} placeholder={isVietnamese ? 'T\u00f3m t\u1eaft c\u00e1ch b\u1ea1n s\u1ebd l\u00e0m, kinh nghi\u1ec7m li\u00ean quan v\u00e0 m\u1ed1c b\u00e0n giao.' : 'Outline your approach, relevant experience, and delivery plan.'} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-pine" />
                              </label>

                              <button type="submit" disabled={proposalSubmitting} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                                {proposalSubmitting
                                  ? (isVietnamese ? '\u0110ang g\u1eedi...' : 'Sending...')
                                  : (myProposal
                                    ? (isVietnamese ? 'C\u1eadp nh\u1eadt ch\u00e0o gi\u00e1' : 'Update bid')
                                    : (isVietnamese ? 'Ch\u00e0o gi\u00e1 d\u1ef1 \u00e1n' : 'Bid on the project'))}
                              </button>
                            </form>

                          {proposalStatus.message ? (
                              <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${proposalStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {proposalStatus.message}
                              </p>
                            ) : null}
                          </div>
                          ) : null}

                          <div className="space-y-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{isVietnamese ? 'Danh s\u00e1ch ch\u00e0o gi\u00e1' : 'Bidder list'}</p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {isVietnamese
                                      ? `C\u00f3 ${proposalCount} ng\u01b0\u1eddi \u0111ang ch\u00e0o gi\u00e1`
                                      : (proposalCount === 1 ? '1 active bidder' : `${proposalCount} active bidders`)}
                                  </p>
                                </div>
                                <span className="rounded-2xl bg-pine/10 px-3 py-1 text-lg font-bold text-pine">{proposalCount}</span>
                              </div>

                              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-2">
                                {selectedJob.proposals?.length ? selectedJob.proposals.map((proposal) => (
                                  <div key={proposal.id || proposal.freelancerId || proposal.freelancerEmail} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{proposal.freelancerName || (isVietnamese ? 'Freelancer ch\u01b0a \u0111\u1eb7t t\u00ean' : 'Unnamed freelancer')}</p>
                                        <p className="mt-1 truncate text-xs text-slate-500">{proposal.freelancerEmail || (isVietnamese ? 'Ch\u01b0a c\u00f3 email' : 'No email')}</p>
                                      </div>
                                      {isJobOwner ? (
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/freelancer-profile/${proposal.freelancerId}`, {
                                              state: {
                                                profileSeed: {
                                                  id: proposal.freelancerId,
                                                  fullName: proposal.freelancerName || proposal.freelancerEmail || '',
                                                  email: proposal.freelancerEmail || '',
                                                  headline: isVietnamese ? 'Freelancer \u0111ang ch\u00e0o gi\u00e1 cho c\u00f4ng vi\u1ec7c n\u00e0y' : 'Freelancer bidding on this job',
                                                },
                                              },
                                            })}
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                          >
                                            {isVietnamese ? 'Xem h\u1ed3 s\u01a1' : 'View profile'}
                                          </button>
                                          {selectedJob.status === 'open' ? (
                                            <button
                                              type="button"
                                              onClick={() => openProposalSelectionDraft(proposal)}
                                              disabled={selectingProposalId === proposal.id}
                                              className="inline-flex items-center justify-center rounded-xl bg-pine px-4 py-2 text-xs font-bold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {selectingProposalId === proposal.id
                                                ? (isVietnamese ? '\u0110ang ch\u1ecdn...' : 'Selecting...')
                                                : (isVietnamese ? 'Ch\u1ecdn freelancer' : 'Select freelancer')}
                                            </button>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>
                                    {isJobOwner ? (
                                      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{isVietnamese ? 'Gi\u00e1 deal' : 'Deal price'}</p>
                                          <p className="mt-1 text-sm font-semibold text-ink">{proposal.bidDisplay || `${proposal.bidAmount || 0} VND`}</p>
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{isVietnamese ? 'Th\u1eddi gian ho\u00e0n th\u00e0nh' : 'Delivery time'}</p>
                                          <p className="mt-1 text-sm font-semibold text-ink">{proposal.timeline || (isVietnamese ? 'Ch\u01b0a ghi r\u00f5' : 'Not specified')}</p>
                                        </div>
                                        {proposal.coverLetter ? (
                                          <div className="sm:col-span-2">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{isVietnamese ? 'L\u1eddi nh\u1eafn deal' : 'Deal note'}</p>
                                            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{proposal.coverLetter}</p>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                )) : (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    {isVietnamese ? 'Ch\u01b0a c\u00f3 ai ch\u00e0o gi\u00e1 cho c\u00f4ng vi\u1ec7c n\u00e0y.' : 'No bids have been submitted yet.'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {role === 'freelancer' && selectedJob.status === 'open' ? (
                              <>
                                <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'L\u1ee3i \u00edch khi ch\u00e0o gi\u00e1' : 'Benefits of bidding'}</h3>
                                <div className="mt-5 space-y-4">
                                  {[
                                    isVietnamese ? '\u0110\u1eb7t ng\u00e2n s\u00e1ch v\u00e0 th\u1eddi gian c\u1ee7a b\u1ea1n' : 'Set your budget and timeframe',
                                    isVietnamese ? 'Nh\u1eadn thanh to\u00e1n an to\u00e0n qua escrow' : 'Get paid securely through escrow',
                                    isVietnamese ? 'Tr\u00ecnh b\u00e0y c\u00e1ch b\u1ea1n s\u1ebd th\u1ef1c hi\u1ec7n' : 'Outline your proposal',
                                    isVietnamese ? 'Mi\u1ec5n ph\u00ed g\u1eedi ch\u00e0o gi\u00e1 cho c\u00f4ng vi\u1ec7c' : "It's free to submit a bid on jobs",
                                  ].map((item) => (
                                    <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                      <CircleCheckBig className="h-5 w-5 text-pine" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>



                    ) : null}
                  </SectionCard>
                </div>

                <div className="space-y-6">
                  <SectionCard className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="muted">{isVietnamese ? 'K\u1ef9 n\u0103ng ph\u00f9 h\u1ee3p' : 'Skill fit'}</p>
                        <h2 className="text-2xl font-bold text-ink">{isVietnamese ? 'K\u1ef9 n\u0103ng c\u1ea7n c\u00f3' : 'Required skills'}</h2>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {(selectedJob.skills?.length ? selectedJob.skills : [isVietnamese ? 'Giao ti\u1ebfp t\u1ed1t' : 'Strong communication', isVietnamese ? 'B\u00e0n giao \u0111\u00fang h\u1ea1n' : 'Reliable delivery']).map((skill) => (
                        <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard className="p-6">
                    <p className="muted">{isVietnamese ? 'T\u00f3m t\u1eaft nhanh' : 'Quick overview'}</p>
                    <h2 className="mt-1 text-2xl font-bold text-ink">{isVietnamese ? 'C\u00e1c \u0111i\u1ec3m c\u1ea7n nh\u1edb' : 'Key facts'}</h2>
                    <div className="mt-6 space-y-3">
                      {[
                        `${isVietnamese ? 'Danh m\u1ee5c' : 'Category'}: ${selectedJob.category}`,
                        `${isVietnamese ? 'Ng\u00e2n s\u00e1ch' : 'Budget'}: ${selectedJob.budget}`,
                        `${isVietnamese ? 'Th\u1eddi gian' : 'Timeline'}: ${selectedJob.timeline || (isVietnamese ? 'Linh ho\u1ea1t' : 'Flexible')}`,
                        `${isVietnamese ? '\u0110\u1ecba \u0111i\u1ec3m' : 'Location'}: ${selectedJob.locationType || 'Remote'}`,
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          {item}
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {selectedJob.milestones?.length ? (
                    <SectionCard className="p-6">
                      <p className="muted">{isVietnamese ? 'K\u1ebf ho\u1ea1ch thanh to\u00e1n' : 'Payment plan'}</p>
                      <h2 className="mt-1 text-2xl font-bold text-ink">{isVietnamese ? 'C\u00e1c milestone' : 'Milestones'}</h2>
                      <div className="mt-6 space-y-3">
                        {selectedJob.milestones.map((milestone, index) => (
                          <div key={`${milestone.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-semibold text-ink">{milestone.title}</p>
                              <span className="text-sm font-semibold text-slate-700">{milestone.amount}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">{milestone.dueDate || (isVietnamese ? 'H\u1ea1n linh ho\u1ea1t' : 'Flexible due date')}</p>
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

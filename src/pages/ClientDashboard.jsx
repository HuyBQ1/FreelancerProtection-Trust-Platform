import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, CircleDollarSign, ClipboardCheck, Download, Eye, FileUp, Landmark, MessageSquareMore, PencilLine, Plus, Receipt, Search, Send, Shield, ShieldCheck, Trash2, Users, Wallet, X, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import PaymentCenter from '../components/PaymentCenter';
import { contracts, disputes, freelancerProfiles, sidebarItems } from '../data/appData';
import { createContractFromAcceptedJob, normalizeContractForView } from '../utils/contractTransforms';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';
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
  workspaceDesc: 'Manage hiring, approvals, payments, and disputes from one client command center.',
  balanceProtected: 'Available balance',
  balanceDesc: 'Shared balance used across your active supplier contracts.',
};
const titles = {
  dashboard: 'Client Dashboard',
  marketplace: 'Talent Marketplace',
  contracts: 'Client Contracts',
  chat: 'Client Chat',
  bank: 'Bank Account',
  escrow: 'Payments',
  disputes: 'Disputes',
  settings: 'Settings',
};
const clientActivities = [
  { title: 'Proposal shortlist updated', description: '3 freelancers were moved to the final review stage for the dashboard redesign role.', time: '20 minutes ago', icon: Users },
  { title: 'Milestone awaiting approval', description: 'Prototype & Animations was submitted and is waiting for your review.', time: '2 hours ago', icon: ClipboardCheck },
  { title: 'Balance updated successfully', description: 'A new payment action was confirmed for the mobile app design contract.', time: 'Yesterday', icon: Shield },
];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('fptp_user') || '{}');
  } catch {
    return {};
  }
}

function hasSubmissionAsset(milestone) {
  return Boolean(
    milestone?.submission?.fileDataUrl ||
    milestone?.submission?.fileName,
  );
}

function getSubmissionPreviewType(submission) {
  const fileType = submission?.fileType || '';
  const fileName = (submission?.fileName || '').toLowerCase();

  if (fileType.startsWith('image/')) {
    return 'image';
  }

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json')) {
    return 'text';
  }

  return 'download';
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getTransactionLabel(type) {
  if (type === 'deposit') return 'Deposit';
  if (type === 'release') return 'Release payment';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'refund') return 'Refund';
  return 'Transaction';
}

function getTransactionTone(type) {
  if (type === 'deposit') {
    return {
      badge: 'bg-emerald-50 text-emerald-700',
      amount: 'text-emerald-600',
      sign: '+',
    };
  }

  if (type === 'release' || type === 'withdrawal') {
    return {
      badge: 'bg-amber-50 text-amber-700',
      amount: 'text-rose-600',
      sign: '-',
    };
  }

  return {
    badge: 'bg-slate-100 text-slate-600',
    amount: 'text-slate-700',
    sign: '',
  };
}

function formatTransactionTime(value) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(readStoredUser);
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [selectedContractId, setSelectedContractId] = useState(`${location.state?.initialContractId || contracts[0]?.id || ''}`);
  const [notificationThreadId, setNotificationThreadId] = useState(location.state?.initialThreadId || '');
  const [query, setQuery] = useState('');
  const [postedJobs, setPostedJobs] = useState([]);
  const [jobStatus, setJobStatus] = useState(location.state?.jobStatus || { type: '', message: '' });
  const [contractFeedback, setContractFeedback] = useState({ type: '', message: '' });
  const [walletStatus, setWalletStatus] = useState({ type: '', message: '' });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [reviewModal, setReviewModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [reviewZoom, setReviewZoom] = useState(1);
  const [reviewPan, setReviewPan] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (location.state?.initialPage) {
      setActivePage(location.state.initialPage);
    }

    if (location.state?.initialContractId) {
      setSelectedContractId(`${location.state.initialContractId}`);
    }

    if (location.state?.initialThreadId) {
      setNotificationThreadId(`${location.state.initialThreadId}`);
    }

    if (location.state?.jobStatus) {
      setJobStatus(location.state.jobStatus);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('fptp_token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/escrow/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.summary) {
          if (data.summary.balance !== undefined) {
            setAvailableBalance(data.summary.balance);
          }
          if (data.summary.pendingBalance !== undefined) {
            setPendingBalance(data.summary.pendingBalance);
          }
          if (Array.isArray(data.summary.recentTransactions)) {
            setRecentTransactions(data.summary.recentTransactions);
          }
        }
      } catch (err) {
        console.error('Failed to fetch escrow summary:', err);
      }
    };
    fetchSummary();
  }, [user, activePage]);

  const fetchMyJobs = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setPostedJobs([]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/jobs/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPostedJobs([]);
        return;
      }

      const nextJobs = Array.isArray(data.jobs) ? data.jobs : [];
      setPostedJobs(nextJobs);
    } catch (err) {
      console.error('Failed to fetch client jobs:', err);
      setPostedJobs([]);
    }
  }, []);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  useEffect(() => {
    if (activePage === 'contracts') {
      fetchMyJobs();
    }
  }, [activePage, fetchMyJobs]);

  const handleDealUpdated = (updatedJob) => {
    if (!updatedJob?.id) return;

    setPostedJobs((currentJobs) => {
      const hasJob = currentJobs.some((job) => `${job.id}` === `${updatedJob.id}`);
      if (!hasJob) {
        return [updatedJob, ...currentJobs];
      }

      return currentJobs.map((job) => (`${job.id}` === `${updatedJob.id}` ? updatedJob : job));
    });
  };

  const acceptedContracts = postedJobs
    .filter((job) => job.status === 'assigned')
    .map(createContractFromAcceptedJob);
  const contractList = acceptedContracts.map((contract, index) => normalizeContractForView(contract, index));
  const selectedClientContract = contractList.find((item) => `${item.id}` === `${selectedContractId}`) ?? contractList[0];

  useEffect(() => {
    if (contractList.length > 0 && !contractList.some((item) => `${item.id}` === `${selectedContractId}`)) {
      setSelectedContractId(`${contractList[0].id}`);
    }
  }, [contractList, selectedContractId]);

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
      navigate(`/client-jobs/${contract.sourceJobId}`);
    }
  };

  const openReviewModal = (contract, milestone, milestoneIndex) => {
    setReviewZoom(1);
    setReviewPan({ x: 0, y: 0 });
    setReviewModal({ open: true, contract, milestone, milestoneIndex });
  };

  const closeReviewModal = () => {
    setReviewZoom(1);
    setReviewPan({ x: 0, y: 0 });
    setReviewModal({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  };

  const handleMilestoneApproval = async (contract, milestone, milestoneIndex) => {
    try {
      if (contract?.source === 'job-acceptance' && contract?.sourceJobId) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setContractFeedback({ type: 'error', message: 'Please log in again before approving this milestone.' });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/contract/milestones/${milestoneIndex}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ actionType: 'approve' }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setContractFeedback({ type: 'error', message: data.message || 'Could not approve this milestone right now.' });
          return;
        }

        setPostedJobs((currentJobs) => currentJobs.map((job) => (job.id === data.job.id ? data.job : job)));
        setContractFeedback({ type: 'success', message: 'Milestone approved and contract progress updated.' });
        return;
      }

      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
    } catch (error) {
      console.error('Failed to approve milestone:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while updating this contract.' });
    }
  };

  const removeSubmittedFile = async (contract, milestoneIndex) => {
    if (!contract?.sourceJobId) {
      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setContractFeedback({ type: 'error', message: 'Please log in again before removing this file.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/contract/milestones/${milestoneIndex}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actionType: 'remove-submission' }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setContractFeedback({ type: 'error', message: data.message || 'Could not remove this file right now.' });
        return;
      }

      setPostedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${data.job.id}` ? data.job : job)));
      await fetchMyJobs();
      closeReviewModal();
      setContractFeedback({ type: 'success', message: 'File removed. The freelancer can upload a corrected document.' });
    } catch (error) {
      console.error('Failed to remove submitted file:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while removing this file.' });
    }
  };

  const cancelClientContract = async (contract) => {
    if (!contract?.sourceJobId) {
      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setContractFeedback({ type: 'error', message: 'Please log in again before cancelling this contract.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setContractFeedback({ type: 'error', message: data.message || 'Could not cancel this contract right now.' });
        return;
      }

      if (data.job) {
        setPostedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${data.job.id}` ? data.job : job)));
      }
      setAvailableBalance((current) => current + (data.refundedAmount || 0));
      setPendingBalance((current) => Math.max(0, current - (data.refundedAmount || 0)));
      setSelectedContractId('');
      setContractFeedback({ type: 'success', message: 'Contract cancelled. The job is open again for freelancers.' });
    } catch (error) {
      console.error('Failed to cancel contract:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while cancelling this contract.' });
    }
  };

  const deleteClientJob = async (jobId, feedbackTarget = 'job') => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      const message = 'Please log in again before deleting this job.';
      if (feedbackTarget === 'contract') {
        setContractFeedback({ type: 'error', message });
      } else {
        setJobStatus({ type: 'error', message });
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || 'Could not delete this job right now.';
        if (feedbackTarget === 'contract') {
          setContractFeedback({ type: 'error', message });
        } else {
          setJobStatus({ type: 'error', message });
        }
        return;
      }

      setPostedJobs((currentJobs) => currentJobs.filter((job) => `${job.id}` !== `${jobId}`));
      setAvailableBalance((current) => current + (data.refundedAmount || 0));
      setPendingBalance((current) => Math.max(0, current - (data.refundedAmount || 0)));
      setSelectedContractId('');

      if (feedbackTarget === 'contract') {
        setContractFeedback({ type: 'success', message: 'Job deleted successfully.' });
      } else {
        setJobStatus({ type: 'success', message: 'Job deleted successfully.' });
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      const message = 'Something went wrong while deleting this job.';
      if (feedbackTarget === 'contract') {
        setContractFeedback({ type: 'error', message });
      } else {
        setJobStatus({ type: 'error', message });
      }
    }
  };

  const handlePreviewWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setReviewZoom((current) => Math.min(3, Math.max(0.5, Number((current + delta).toFixed(2)))));
  };

  const handlePreviewMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: reviewPan.x,
      panY: reviewPan.y,
    };
  };

  const handlePreviewMouseMove = (event) => {
    if (!dragStateRef.current.active || (event.buttons & 1) !== 1) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    setReviewPan({
      x: dragStateRef.current.panX + deltaX,
      y: dragStateRef.current.panY + deltaY,
    });
  };

  const handlePreviewMouseUp = () => {
    dragStateRef.current.active = false;
  };

  useEffect(() => {
    if (!reviewModal.open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewModal.open]);

  const releasePayment = async () => {
    const releaseAmount = Number(walletAmount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(releaseAmount) || releaseAmount <= 0) {
      setWalletStatus({ type: 'error', message: 'Enter a valid amount before releasing payment.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setWalletStatus({ type: 'error', message: 'Please log in again before releasing payment.' });
      return;
    }

    setWalletLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/escrow/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: releaseAmount }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not release payment.');
      }

      setAvailableBalance(data.summary?.balance ?? availableBalance);
      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }
      setWalletAmount('');
      setWalletStatus({ type: 'success', message: 'Payment released successfully.' });

      const nextUser = {
        ...user,
        balance: data.summary?.balance ?? availableBalance,
      };
      setUser(nextUser);
      localStorage.setItem('fptp_user', JSON.stringify(nextUser));
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not release payment.',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const topUpBalance = async () => {
    const topUpAmount = Number(walletAmount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(topUpAmount) || topUpAmount <= 0) {
      setWalletStatus({ type: 'error', message: 'Enter a valid amount before topping up.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setWalletStatus({ type: 'error', message: 'Please log in again before topping up.' });
      return;
    }

    setWalletLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/escrow/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: topUpAmount }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not top up balance.');
      }

      setAvailableBalance(data.summary?.balance ?? availableBalance);
      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }
      setWalletAmount('');
      setWalletStatus({ type: 'success', message: 'Balance topped up successfully.' });

      const nextUser = {
        ...user,
        balance: data.summary?.balance ?? availableBalance,
      };
      setUser(nextUser);
      localStorage.setItem('fptp_user', JSON.stringify(nextUser));
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not top up balance.',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const dashboardLayout = (content) => (
    <div className={`${activePage === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-100/80`}>
      <div className={`mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8 ${activePage === 'chat' ? 'h-full overflow-hidden' : ''}`}>
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={labels} />
        <div className={`min-w-0 flex-1 ${activePage === 'chat' ? 'flex min-h-0 flex-col space-y-4 overflow-hidden' : 'space-y-6'}`}>
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
            onNotificationOpen={(notification) => {
              if (notification?.actionPage === 'chat') {
                setNotificationThreadId(notification.metadata?.threadId || notification.actionId || '');
                setActivePage('chat');
                return;
              }

              if (notification?.actionPage === 'contracts') {
                const jobId = notification.metadata?.jobId || notification.actionId;
                if (jobId) {
                  setSelectedContractId(`job-contract-${jobId}`);
                }
                setActivePage('contracts');
                return;
              }

              if (notification?.actionPage && titles[notification.actionPage]) {
                setActivePage(notification.actionPage);
              }
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
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="muted">Your job posts</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Create and manage hiring briefs</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open any posted role to review the full brief, and create new jobs from a dedicated page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/client-jobs/new')}
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </button>
          </div>
          {jobStatus.message ? (
            <p className={`mt-6 rounded-2xl px-4 py-3 text-sm ${jobStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {jobStatus.message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {postedJobs.map((job) => (
              <div key={job.id} className="space-y-3">
                <JobCard
                  job={job}
                  labels={{ budget: 'Budget', client: 'Client' }}
                  actionLabel="View Job"
                  onAction={() => navigate(`/client-jobs/${job.id}`)}
                />
                <button
                  type="button"
                  onClick={() => navigate(`/client-jobs/${job.id}/edit`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Job Post
                </button>
                <button
                  type="button"
                  onClick={() => deleteClientJob(job.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Job
                </button>
              </div>
            ))}
          </div>

          {postedJobs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              You have not posted any jobs yet. Use `Add Job` to create your first hiring brief.
            </div>
          ) : null}
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
    if (!selectedClientContract) {
      return dashboardLayout(
        <SectionCard className="p-8">
          <p className="muted">Contracts</p>
          <h2 className="mt-2 text-xl font-bold text-ink">No contracts available yet</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Accepted jobs and active supplier agreements will appear here once work is in progress.
          </p>
        </SectionCard>,
      );
    }

    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Client contracts</h2>
          <p className="mt-2 text-sm text-slate-500">{contractList.length} supplier agreements under your review</p>
        </div>
        {contractFeedback.message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${contractFeedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {contractFeedback.message}
          </div>
        ) : null}
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {contractList.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(`${contract.id}`)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${`${contract.id}` === `${selectedClientContract.id}` ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-xl font-semibold text-ink">{contract.title.en}</p>
                <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <SectionCard className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-ink">{selectedClientContract.title.en}</h3>
                <p className="mt-2 text-slate-500">{selectedClientContract.client}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => cancelClientContract(selectedClientContract)}
                  className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Contract
                </button>
                <button
                  type="button"
                  onClick={() => deleteClientJob(selectedClientContract.sourceJobId, 'contract')}
                  className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Job
                </button>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div><p className="text-sm text-slate-500">Approved budget</p><p className="mt-2 text-2xl font-bold text-ink">{selectedClientContract.budget}</p></div>
              <div><p className="text-sm text-slate-500">Released so far</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedClientContract.earned}</p></div>
              <div><p className="text-sm text-slate-500">Progress</p><p className="mt-2 text-2xl font-bold text-ink">{selectedClientContract.progress}%</p></div>
            </div>
            <div className="mt-8 space-y-4">
              {selectedClientContract.milestones.map((milestone, milestoneIndex) => (
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
                        <button
                          onClick={() => {
                            if (hasSubmissionAsset(milestone)) {
                              openReviewModal(selectedClientContract, milestone, milestoneIndex);
                              return;
                            }

                            openContractBrief(selectedClientContract);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                          {milestone.reviewAction}
                        </button>
                      ) : null}
                      {(milestone.action === 'Approve' || milestone.reviewAction === 'Review Product') ? (
                        <button
                          onClick={() => openReviewModal(selectedClientContract, milestone, milestoneIndex)}
                          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
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
        {reviewModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-6xl rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Review milestone delivery</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{reviewModal.milestone?.title?.en}</h3>
                  <p className="mt-2 text-sm text-slate-500">Review the freelancer submission before approving this stage.</p>
                </div>
                <button onClick={closeReviewModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {reviewModal.milestone?.submission?.fileDataUrl ? (
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">Live preview</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setReviewZoom((value) => Math.max(0.75, Number((value - 0.25).toFixed(2))))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                          -
                        </button>
                        <button onClick={() => setReviewZoom(1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                          100%
                        </button>
                        <button onClick={() => setReviewZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                          +
                        </button>
                      </div>
                    </div>
                    {getSubmissionPreviewType(reviewModal.milestone.submission) === 'image' ? (
                      <div
                        onWheel={handlePreviewWheel}
                        onMouseDown={handlePreviewMouseDown}
                        onMouseMove={handlePreviewMouseMove}
                        onMouseUp={handlePreviewMouseUp}
                        onMouseLeave={handlePreviewMouseUp}
                        className="relative flex min-h-[620px] cursor-grab items-center justify-center overflow-hidden p-6 active:cursor-grabbing"
                      >
                        <img
                          src={reviewModal.milestone.submission.fileDataUrl}
                          alt={reviewModal.milestone.submission.fileName || 'Submitted work'}
                          className="max-h-[560px] max-w-[90%] select-none object-contain"
                          draggable="false"
                          style={{ transform: `translate(${reviewPan.x}px, ${reviewPan.y}px) scale(${reviewZoom})`, transformOrigin: 'center center' }}
                        />
                      </div>
                    ) : getSubmissionPreviewType(reviewModal.milestone.submission) === 'pdf' ? (
                      <div
                        onWheel={handlePreviewWheel}
                        onMouseDown={handlePreviewMouseDown}
                        onMouseMove={handlePreviewMouseMove}
                        onMouseUp={handlePreviewMouseUp}
                        onMouseLeave={handlePreviewMouseUp}
                        className="relative flex min-h-[620px] cursor-grab items-center justify-center overflow-hidden bg-white p-4 active:cursor-grabbing"
                      >
                        <div
                          className="pointer-events-none w-[900px] bg-white shadow-sm"
                          style={{ transform: `translate(${reviewPan.x}px, ${reviewPan.y}px) scale(${reviewZoom})`, transformOrigin: 'center center' }}
                        >
                          <iframe
                            src={reviewModal.milestone.submission.fileDataUrl}
                            title={reviewModal.milestone.submission.fileName || 'Submitted PDF'}
                            className="h-[620px] w-full bg-white"
                          />
                        </div>
                      </div>
                    ) : getSubmissionPreviewType(reviewModal.milestone.submission) === 'text' ? (
                      <div
                        onWheel={handlePreviewWheel}
                        onMouseDown={handlePreviewMouseDown}
                        onMouseMove={handlePreviewMouseMove}
                        onMouseUp={handlePreviewMouseUp}
                        onMouseLeave={handlePreviewMouseUp}
                        className="relative flex min-h-[620px] cursor-grab items-center justify-center overflow-hidden bg-white p-4 active:cursor-grabbing"
                      >
                        <div
                          className="pointer-events-none w-[900px] bg-white shadow-sm"
                          style={{ transform: `translate(${reviewPan.x}px, ${reviewPan.y}px) scale(${reviewZoom})`, transformOrigin: 'center center' }}
                        >
                          <iframe
                            src={reviewModal.milestone.submission.fileDataUrl}
                            title={reviewModal.milestone.submission.fileName || 'Submitted text file'}
                            className="h-[620px] w-full bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[620px] flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
                        <FileUp className="h-10 w-10 text-indigo-500" />
                        <p className="font-semibold text-slate-700">{reviewModal.milestone.submission.fileName || 'Submitted file'}</p>
                        <p className="text-sm">Preview is not available for this file type yet, but you can download the attachment below.</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Freelancer note</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{reviewModal.milestone.submission.note || 'No delivery note was provided.'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Attachment</p>
                      <p className="mt-2 text-sm text-slate-500">{reviewModal.milestone.submission.fileName || 'No file attached'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={reviewModal.milestone.submission.fileDataUrl}
                        download={reviewModal.milestone.submission.fileName || 'submission'}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                      >
                        <Download className="h-4 w-4" />
                        Download file
                      </a>
                      {(reviewModal.milestone?.action === 'Approve' || reviewModal.milestone?.reviewAction === 'Review Product') ? (
                        <button
                          onClick={async () => {
                            await handleMilestoneApproval(reviewModal.contract, reviewModal.milestone, reviewModal.milestoneIndex);
                            closeReviewModal();
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <MessageSquareMore className="h-4 w-4" />
                          Approve milestone
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeSubmittedFile(reviewModal.contract, reviewModal.milestoneIndex)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Remove file
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  No submitted file is attached to this milestone yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>,
    );
  }

  if (activePage === 'escrow') {
    return dashboardLayout(
      <PaymentCenter
        mode="client"
        balance={availableBalance}
        pendingBalance={pendingBalance}
        walletAmount={walletAmount}
        onWalletAmountChange={setWalletAmount}
        walletLoading={walletLoading}
        walletStatus={walletStatus}
        recentTransactions={recentTransactions}
        formatMoney={formatMoney}
        formatTransactionTime={formatTransactionTime}
        getTransactionLabel={getTransactionLabel}
        getTransactionTone={getTransactionTone}
        onTopUp={topUpBalance}
        onRelease={releasePayment}
      />,
    );

    return dashboardLayout(
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
          <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.22),transparent_28%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
            <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Client payment center</p>
                  <p className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white">{formatMoney(availableBalance)}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +12.4% vs last month
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Protected payments</p>
                  <p className="mt-2 text-lg font-semibold text-white">Enterprise ready</p>
                  <p className="mt-1 text-xs text-white/55">Fraud checks, verified vendors, release controls</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                  <input
                    value={walletAmount}
                    onChange={(event) => setWalletAmount(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Enter amount, for example 500"
                  />
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Usage note</p>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    Use one shared balance for top-ups and payment releases. The wallet stays simple, readable, and controlled in one place.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={topUpBalance}
                  disabled={walletLoading}
                  className="rounded-2xl bg-[#00B386] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Top Up
                </button>
                <button
                  onClick={releasePayment}
                  disabled={walletLoading}
                  className="rounded-2xl border border-white/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1020] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Release Payment
                </button>
              </div>

              {walletStatus.message ? (
                <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${walletStatus.type === 'error' ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100'}`}>
                  {walletStatus.message}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Upcoming releases</p>
                  <p className="mt-2 text-2xl font-bold text-white">$3,240</p>
                  <p className="mt-1 text-xs text-white/55">Across 4 active supplier contracts this week</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Security and trust</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    Fraud protection active
                  </div>
                  <p className="mt-3 text-xs text-white/55">Protected payouts, verification checks, and release control included.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Transactions</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Payment history</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {recentTransactions.length} items
            </div>
          </div>

          <div className="mt-6 flex min-h-[420px] flex-col rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 xl:h-[calc(100vh-18rem)] xl:min-h-[520px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest activity</p>
                <p className="mt-2 text-lg font-semibold text-ink">Recent payment movements</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                Live ledger
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1 xl:min-h-0">
              {recentTransactions.slice(0, 8).map((transaction, index) => {
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
                        <span className="text-sm font-semibold text-ink">{getTransactionLabel(transaction.type)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                          {isPositive ? 'Incoming' : 'Outgoing'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {transaction.description || 'Wallet transaction recorded.'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tone.amount}`}>{tone.sign}{formatMoney(transaction.amount || 0)}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">Completed</p>
                    </div>
                  </div>
                );
              })}

              {recentTransactions.length === 0 ? (
                <div className="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center text-sm leading-6 text-slate-500">
                  No transaction history yet. Deposits and payment releases will appear here.
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>,
    );
    const paymentActionCards = [
      {
        label: 'Top up balance',
        description: 'Add funds from your payment method into the client wallet.',
        icon: Wallet,
        accent: 'bg-emerald-500/12 text-emerald-300',
      },
      {
        label: 'Release payment',
        description: 'Send approved milestone funds straight from the same balance.',
        icon: Send,
        accent: 'bg-sky-500/12 text-sky-300',
      },
      {
        label: 'Create milestone payout',
        description: 'Prepare the next release amount for an active supplier contract.',
        icon: Landmark,
        accent: 'bg-violet-500/12 text-violet-300',
      },
      {
        label: 'Request invoice',
        description: 'Collect billing proof and accounting records for your finance team.',
        icon: Receipt,
        accent: 'bg-amber-400/12 text-amber-200',
      },
    ];

    return dashboardLayout(
      <div className="grid items-start gap-6 xl:h-[calc(100vh-12.5rem)] xl:grid-cols-[1.08fr_0.92fr] xl:overflow-hidden">
        <div className="grid gap-6 xl:h-full xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)]">
          <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.22),transparent_28%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
              <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Client payment center</p>
                    <p className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white">{formatMoney(availableBalance)}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      +12.4% vs last month
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Protected payments</p>
                    <p className="mt-2 text-lg font-semibold text-white">Enterprise ready</p>
                    <p className="mt-1 text-xs text-white/55">Fraud checks, verified vendors, release controls</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                    <input
                      value={walletAmount}
                      onChange={(event) => setWalletAmount(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="Enter amount, for example 500"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={topUpBalance}
                        disabled={walletLoading}
                        className="rounded-2xl bg-[#00B386] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Top Up
                      </button>
                      <button
                        onClick={releasePayment}
                        disabled={walletLoading}
                        className="rounded-2xl border border-white/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1020] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Release Payment
                      </button>
                    </div>
                    {walletStatus.message ? (
                      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${walletStatus.type === 'error' ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100'}`}>
                        {walletStatus.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Upcoming releases</p>
                      <p className="mt-2 text-2xl font-bold text-white">$3,240</p>
                      <p className="mt-1 text-xs text-white/55">Across 4 active contracts this week</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Verification</p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        Fraud protection active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:min-h-0 xl:grid-cols-[1.04fr_0.96fr]">
            <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="muted">Smart actions</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">Payment tools</h2>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">Recommended</span>
                  <span className="px-3 py-1">Shortcuts</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {paymentActionCards.map((action) => (
                  <div key={action.label} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.accent}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-ink">{action.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Monthly spend</p>
                  <p className="mt-3 text-2xl font-bold text-ink">$18.4k</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#00B386] to-emerald-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Active contracts</p>
                  <p className="mt-3 text-2xl font-bold text-ink">$7.9k</p>
                  <p className="mt-2 text-xs text-slate-500">Payments distributed across 8 suppliers</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Trust status</p>
                  <p className="mt-3 text-2xl font-bold text-ink">Verified</p>
                  <p className="mt-2 text-xs text-slate-500">Protected payment rails and vendor checks enabled</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="muted">Analytics</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">Cash flow & vendor mix</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                  Updated 5m ago
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFD] p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Monthly spending</p>
                      <p className="mt-1 text-xs text-slate-500">Rolling 6-month payout curve</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      18.2%
                    </div>
                  </div>
                  <div className="mt-6 flex h-40 items-end gap-3">
                    {[42, 58, 52, 75, 68, 90].map((value, index) => (
                      <div key={value + index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-32 w-full items-end rounded-2xl bg-white/80 p-1">
                          <div
                            className={`w-full rounded-[14px] ${index === 5 ? 'bg-gradient-to-t from-[#00B386] to-emerald-300' : 'bg-gradient-to-t from-slate-300 to-slate-200'}`}
                            style={{ height: `${value}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Vendor distribution</p>
                    <div className="mt-4 space-y-3">
                      {[
                        ['Design', '38%', 'bg-emerald-500'],
                        ['Engineering', '34%', 'bg-sky-500'],
                        ['Security', '18%', 'bg-violet-500'],
                        ['Other', '10%', 'bg-slate-300'],
                      ].map(([label, value, color]) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{label}</span>
                            <span className="font-semibold text-ink">{value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Trust layer</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Protected payments</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Vendor verification active</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Approval controls enabled</div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl xl:flex xl:h-full xl:flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Transactions</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Payment history</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {recentTransactions.length} items
            </div>
          </div>

          <div className="mt-6 flex min-h-[420px] flex-col rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 xl:min-h-0 xl:flex-1">
            <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500 shadow-sm">
              <span className="rounded-full bg-[#0B1020] px-3 py-1 text-white">All</span>
              <span className="px-3 py-1">Incoming</span>
              <span className="px-3 py-1">Outgoing</span>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1 xl:min-h-0">
              {recentTransactions.slice(0, 8).map((transaction, index) => {
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
                        <span className="text-sm font-semibold text-ink">{getTransactionLabel(transaction.type)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                          {isPositive ? 'Incoming' : 'Outgoing'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {transaction.description || 'Wallet transaction recorded.'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tone.amount}`}>
                      {tone.sign}{formatMoney(transaction.amount || 0)}
                    </span>
                  </div>
                );
              })}

              {recentTransactions.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <CircleDollarSign className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink">No payment activity yet</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Your top-ups, milestone releases, and vendor payouts will appear here as soon as activity starts.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>,
    );
  }

  if (activePage === 'chat') {
    return dashboardLayout(
      <ChatPanel
        currentUser={user}
        userName={user?.fullName || user?.email || 'Client'}
        initialThreadId={notificationThreadId || location.state?.initialThreadId || ''}
        onDealUpdated={handleDealUpdated}
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Manage hiring, approvals, and payments</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">Review incoming work, approve milestones, manage available balance, and keep every contract under control from one client workspace.</p>
            <div className="mt-6 flex flex-wrap gap-3">
               <button onClick={() => navigate('/client-jobs/new')} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">Add Job</button>
               <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Review Proposals</button>
              <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Open Payments</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Pending approvals</p><p className="mt-2 text-3xl font-bold text-ink">3</p><p className="mt-2 text-sm text-slate-500">Milestones waiting for your review this week.</p></div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Available balance</p><p className="mt-2 text-3xl font-bold text-ink">{formatMoney(availableBalance)}</p><p className="mt-2 text-sm text-slate-500">Use this shared balance for top-ups and milestone releases.</p><button onClick={() => setActivePage('escrow')} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Open payments</button></div>
            </div>
          </div>
        </div>
      </SectionCard>
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { label: 'Open jobs', value: '12', hint: '4 new proposals today', icon: BriefcaseBusiness, accent: 'bg-pine/10 text-pine' },
          { label: 'Pending approvals', value: '3', hint: 'Milestones waiting for review', icon: ClipboardCheck, accent: 'bg-coral/10 text-coral' },
          { label: 'Available balance', value: formatMoney(availableBalance), hint: 'Shared balance used for platform payments', icon: CircleDollarSign, accent: 'bg-gold/10 text-gold' },
        ].map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <SectionCard className="p-6">
        <div><p className="muted">Client activity</p><h2 className="mt-1 text-xl font-bold text-ink">Hiring and approval overview</h2></div>
        <div className="mt-6 space-y-4">
          {clientActivities.map((activity) => <div key={activity.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div><div className="flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">{activity.title}</h3><span className="text-sm text-slate-400">{activity.time}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{activity.description}</p></div></div>)}
        </div>
      </SectionCard>
    </div>,
  );
}

export default ClientDashboard;

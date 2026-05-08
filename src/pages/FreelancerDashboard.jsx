import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, ChevronRight, CircleCheckBig, CircleDollarSign, Clock3, Download, Eye, FileCheck2, FileUp, HandCoins, Hourglass, Search, Shield, Sparkles, TrendingUp, Upload, UserRound, WalletCards, X, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import PaymentCenter from '../components/PaymentCenter';
import { contracts, disputes, sidebarItems } from '../data/appData';
import { createContractFromAcceptedJob, normalizeContractForView } from '../utils/contractTransforms';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
const filters = ['All', 'Design', 'Development', 'Security', 'Legal'];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('fptp_user') || '{}');
  } catch {
    return {};
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`${reader.result || ''}`);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
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

function parseMoneyAmount(value) {
  const parsed = Number.parseFloat(`${value || ''}`.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTransactionLabel(type) {
  if (type === 'deposit') return 'Deposit';
  if (type === 'release') return 'Release payment';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'refund') return 'Refund';
  return 'Transaction';
}

function getTransactionTone(type) {
  if (type === 'release' || type === 'deposit') {
    return {
      badge: 'bg-emerald-50 text-emerald-700',
      amount: 'text-emerald-600',
      sign: '+',
    };
  }

  if (type === 'withdrawal') {
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
  balanceProtected: 'Available balance',
  balanceDesc: 'Shared balance used for payouts and platform payments.',
};

const titles = {
  dashboard: 'Dashboard',
  marketplace: 'Marketplace',
  contracts: 'Contracts',
  chat: 'Chat',
  bank: 'Bank Account',
  escrow: 'Payments',
  disputes: 'Disputes',
  settings: 'Settings',
};

function FreelancerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingInitialContractId, setPendingInitialContractId] = useState(`${location.state?.initialContractId || ''}`);
  const [user, setUser] = useState(readStoredUser);
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [settingsSection, setSettingsSection] = useState('profile');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedContractId, setSelectedContractId] = useState(`${location.state?.initialContractId || contracts[0]?.id || ''}`);
  const [notificationThreadId, setNotificationThreadId] = useState(location.state?.initialThreadId || '');
  const [selectedDisputeId, setSelectedDisputeId] = useState(disputes[0]?.id ?? 1);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [jobList, setJobList] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [contractFeedback, setContractFeedback] = useState({ type: '', message: '' });
  const [walletStatus, setWalletStatus] = useState({ type: '', message: '' });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [submitModal, setSubmitModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [reviewModal, setReviewModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [reviewZoom, setReviewZoom] = useState(1);
  const [reviewPan, setReviewPan] = useState({ x: 0, y: 0 });
  const [submitForm, setSubmitForm] = useState({ note: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (location.state?.initialPage) {
      setActivePage(location.state.initialPage);
    }

    if (location.state?.initialContractId) {
      setPendingInitialContractId(`${location.state.initialContractId}`);
    }

    if (location.state?.initialThreadId) {
      setNotificationThreadId(`${location.state.initialThreadId}`);
    }

    if (location.state?.acceptedJob?.id) {
      setAcceptedJobs((currentJobs) => {
        const nextJob = location.state.acceptedJob;
        const remainingJobs = currentJobs.filter((job) => `${job.id}` !== `${nextJob.id}`);
        return [nextJob, ...remainingJobs];
      });
    }

    if (location.state?.paymentSummary) {
      if (location.state.paymentSummary.balance !== undefined) {
        setAvailableBalance(location.state.paymentSummary.balance);
      }

      if (location.state.paymentSummary.pendingBalance !== undefined) {
        setPendingBalance(location.state.paymentSummary.pendingBalance);
      }

      if (Array.isArray(location.state.paymentSummary.recentTransactions)) {
        setRecentTransactions(location.state.paymentSummary.recentTransactions);
      }
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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setJobList([]);
          return;
        }

        setJobList(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (err) {
        console.error('Failed to fetch public jobs:', err);
        setJobList([]);
      }
    };

    fetchJobs();
  }, []);

  const fetchAssignedJobs = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAssignedJobs();
  }, [fetchAssignedJobs, location.state?.initialContractId]);

  useEffect(() => {
    if (activePage === 'contracts') {
      fetchAssignedJobs();
    }
  }, [activePage, fetchAssignedJobs]);

  const handleDealUpdated = (updatedJob) => {
    if (!updatedJob?.id) return;

    setAcceptedJobs((currentJobs) => {
      const hasJob = currentJobs.some((job) => `${job.id}` === `${updatedJob.id}`);
      if (!hasJob) {
        return [updatedJob, ...currentJobs];
      }

      return currentJobs.map((job) => (`${job.id}` === `${updatedJob.id}` ? updatedJob : job));
    });
  };

  const marketplaceJobs = jobList;

  const filteredJobs = marketplaceJobs.filter((job) => (
    (job.title.toLowerCase().includes(query.toLowerCase()) || job.client.toLowerCase().includes(query.toLowerCase())) &&
    (selectedFilter === 'All' || job.category === selectedFilter)
  ));
  const contractList = [
    ...acceptedJobs.map(createContractFromAcceptedJob),
  ].map((contract, index) => normalizeContractForView(contract, index));
  const selectedContract = contractList.find((item) => `${item.id}` === `${selectedContractId}`) ?? contractList[0];
  const selectedDispute = disputes.find((item) => item.id === selectedDisputeId) ?? disputes[0];

  useEffect(() => {
    if (pendingInitialContractId) {
      setSelectedContractId(`${pendingInitialContractId}`);
      setPendingInitialContractId('');
      return;
    }

    if (contractList.length > 0 && !contractList.some((item) => `${item.id}` === `${selectedContractId}`)) {
      setSelectedContractId(`${contractList[0].id}`);
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

  const handleNotificationOpen = (notification) => {
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
  };

  const openContractBrief = (contract) => {
    if (contract?.source === 'job-acceptance' && contract?.sourceJobId) {
      navigate(`/freelancer-jobs/${contract.sourceJobId}`);
    }
  };

  const openSubmitModal = (contract, milestone, milestoneIndex) => {
    setSubmitForm({ note: milestone?.submission?.note || '', file: null });
    setSubmitModal({ open: true, contract, milestone, milestoneIndex });
  };

  const openReviewModal = (contract, milestone, milestoneIndex) => {
    setReviewZoom(1);
    setReviewPan({ x: 0, y: 0 });
    setReviewModal({ open: true, contract, milestone, milestoneIndex });
  };

  const closeSubmitModal = () => {
    setSubmitModal({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
    setSubmitForm({ note: '', file: null });
    setSubmitting(false);
  };

  const closeReviewModal = () => {
    setReviewZoom(1);
    setReviewPan({ x: 0, y: 0 });
    setReviewModal({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  };

  const handleMilestoneSubmit = async (contract, milestone, milestoneIndex, submissionPayload) => {
    try {
      if (contract?.source === 'job-acceptance' && contract?.sourceJobId) {
        const token = localStorage.getItem('fptp_token');
        if (!token) {
          setContractFeedback({ type: 'error', message: 'Please log in again before submitting contract work.' });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/contract/milestones/${milestoneIndex}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ actionType: 'submit', submission: submissionPayload }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setContractFeedback({ type: 'error', message: data.message || 'Could not submit this milestone right now.' });
          return;
        }

        setAcceptedJobs((currentJobs) => currentJobs.map((job) => (job.id === data.job.id ? data.job : job)));
        setContractFeedback({ type: 'success', message: 'Milestone submitted. The client can review it now.' });
        return;
      }

      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
    } catch (error) {
      console.error('Failed to submit milestone:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while updating this contract.' });
    }
  };

  const removeSubmittedFile = async (contract, milestoneIndex) => {
    if (!contract?.sourceJobId) {
      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
      return;
    }

    const token = localStorage.getItem('fptp_token');
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

      setAcceptedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${data.job.id}` ? data.job : job)));
      await fetchAssignedJobs();
      closeReviewModal();
      setContractFeedback({ type: 'success', message: 'File removed. You can upload the corrected document again.' });
    } catch (error) {
      console.error('Failed to remove submitted file:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while removing this file.' });
    }
  };

  const submitContractWork = async () => {
    if (!submitModal.contract || !submitModal.milestone) {
      return;
    }

    if (!submitForm.file) {
      setContractFeedback({ type: 'error', message: 'Please attach a file before submitting work.' });
      return;
    }

    try {
      setSubmitting(true);
      const fileDataUrl = await readFileAsDataUrl(submitForm.file);
      await handleMilestoneSubmit(
        submitModal.contract,
        submitModal.milestone,
        submitModal.milestoneIndex,
        {
          note: submitForm.note.trim(),
          fileName: submitForm.file.name,
          fileType: submitForm.file.type || 'application/octet-stream',
          fileDataUrl,
        },
      );
      closeSubmitModal();
    } catch (error) {
      console.error('Failed to prepare submission:', error);
      setContractFeedback({ type: 'error', message: 'Could not prepare the file for submission.' });
      setSubmitting(false);
    }
  };

  const cancelAcceptedJob = async (contract) => {
    if (!contract?.sourceJobId) {
      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
      return;
    }

    const token = localStorage.getItem('fptp_token');
    if (!token) {
      setContractFeedback({ type: 'error', message: 'Please log in again before cancelling this job.' });
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
        setContractFeedback({ type: 'error', message: data.message || 'Could not cancel this job right now.' });
        return;
      }

      setAcceptedJobs((currentJobs) => currentJobs.filter((job) => `${job.id}` !== `${contract.sourceJobId}`));
      if (data.job) {
        setJobList((currentJobs) => {
          const withoutJob = currentJobs.filter((job) => `${job.id}` !== `${data.job.id}`);
          return [data.job, ...withoutJob];
        });
      }
      setPendingBalance((current) => Math.max(0, current - (data.refundedAmount || 0)));
      setSelectedContractId('');
      setContractFeedback({ type: 'success', message: 'Job cancelled. It is available again in Marketplace.' });
    } catch (error) {
      console.error('Failed to cancel job:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while cancelling this job.' });
    }
  };

  const handleWalletAction = async () => {
    const amount = Number(walletAmount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletStatus({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }

    const token = localStorage.getItem('fptp_token');
    if (!token) {
      setWalletStatus({ type: 'error', message: 'Please log in again before withdrawing.' });
      return;
    }

    setWalletLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/escrow/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not withdraw funds.');
      }

      const nextBalance = data.summary?.balance ?? availableBalance;
      setAvailableBalance(nextBalance);
      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }
      setWalletAmount('');
      setWalletStatus({ type: 'success', message: 'Funds withdrawn successfully.' });

      const nextUser = {
        ...user,
        balance: nextBalance,
      };
      setUser(nextUser);
      localStorage.setItem('fptp_user', JSON.stringify(nextUser));
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not withdraw funds.',
      });
    } finally {
      setWalletLoading(false);
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

  const activeContracts = contractList.filter((contract) => contract.status !== 'Completed');
  const completedContracts = contractList.filter((contract) => contract.status === 'Completed');
  const totalContractValue = contractList.reduce((total, contract) => total + parseMoneyAmount(contract.budget), 0);
  const earnedValue = contractList.reduce((total, contract) => total + parseMoneyAmount(contract.earned), 0);
  const completedMilestoneCount = contractList.reduce((total, contract) => total + (contract.completedMilestones || 0), 0);
  const totalMilestoneCount = contractList.reduce((total, contract) => total + (contract.totalMilestones || 0), 0);
  const nextMilestones = contractList
    .flatMap((contract) => contract.milestones
      .filter((milestone) => !['Approved', 'Completed'].includes(milestone.status))
      .map((milestone) => ({ ...milestone, contractTitle: contract.title.en, contractId: contract.id })))
    .slice(0, 4);
  const recommendedJobs = jobList.filter((job) => `${job.status || 'open'}`.toLowerCase() === 'open').slice(0, 3);
  const transactionBars = recentTransactions.slice(0, 6).reverse();
  const maxTransactionAmount = Math.max(1, ...transactionBars.map((transaction) => transaction.amount || 0));
  const completionRate = totalMilestoneCount > 0 ? Math.round((completedMilestoneCount / totalMilestoneCount) * 100) : 0;

  const dashboardLayout = (content) => (
    <div className={`${activePage === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-100/80`}>
      <div className={`mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8 ${activePage === 'chat' ? 'h-full overflow-hidden' : ''}`}>
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={labels} />
        <div className={`min-w-0 flex-1 ${activePage === 'chat' ? 'flex min-h-0 flex-col space-y-4 overflow-hidden' : 'space-y-6'}`}>
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
            onNotificationOpen={handleNotificationOpen}
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
    if (!selectedContract) {
      return dashboardLayout(
        <SectionCard className="p-8">
          <p className="muted">Contracts</p>
          <h2 className="mt-2 text-xl font-bold text-ink">No contracts available yet</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Accepted jobs and active contracts will appear here once a client and freelancer start working together.
          </p>
        </SectionCard>,
      );
    }

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
        {contractFeedback.message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${contractFeedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {contractFeedback.message}
          </div>
        ) : null}
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {contractList.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(`${contract.id}`)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${`${contract.id}` === `${selectedContract.id}` ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cancelAcceptedJob(selectedContract)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Job
                  </button>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${selectedContract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{selectedContract.status}</span>
                </div>
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
                {selectedContract.milestones.map((milestone, milestoneIndex) => {
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
                        {milestone.reviewAction ? (
                          <button
                            onClick={() => {
                              if (hasSubmissionAsset(milestone)) {
                                openReviewModal(selectedContract, milestone, milestoneIndex);
                                return;
                              }

                              openContractBrief(selectedContract);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                          >
                            <Eye className="h-4 w-4" />
                            {milestone.reviewAction}
                          </button>
                        ) : null}
                        {milestone.action ? (
                          <button
                            onClick={() => {
                              if (!isApprove) {
                                openSubmitModal(selectedContract, milestone, milestoneIndex);
                              }
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isApprove ? 'cursor-default border border-emerald-500 text-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                          >
                            {isApprove ? <Eye className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                            {milestone.action}
                          </button>
                        ) : null}
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
        {submitModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Submit milestone work</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{submitModal.milestone?.title?.en}</h3>
                  <p className="mt-2 text-sm text-slate-500">Upload the delivery file and a short note for the client.</p>
                </div>
                <button onClick={closeSubmitModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Delivery note</span>
                  <textarea
                    value={submitForm.note}
                    onChange={(event) => setSubmitForm((current) => ({ ...current, note: event.target.value }))}
                    rows={4}
                    placeholder="Summarize what you completed, what the client should review, and any key links or notes."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{submitForm.file ? submitForm.file.name : 'Attach delivery file'}</p>
                      <p className="text-xs text-slate-500">{submitForm.file ? 'Ready to upload with this submission.' : 'Choose an image, PDF, archive, or any handoff file.'}</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => setSubmitForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button onClick={closeSubmitModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={submitContractWork}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {reviewModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-6xl rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Submitted work review</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{reviewModal.milestone?.title?.en}</h3>
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
                        <p className="text-sm">Preview is not available for this file type, but you can download it below.</p>
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
                        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Download className="h-4 w-4" />
                        Download file
                      </a>
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
        mode="freelancer"
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
        onWithdraw={handleWalletAction}
        onOpenBank={() => setActivePage('bank')}
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
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Freelancer payout center</p>
                  <p className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white">{formatMoney(availableBalance)}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +8.1% vs last month
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Verified payouts</p>
                  <p className="mt-2 text-lg font-semibold text-white">Bank ready</p>
                  <p className="mt-1 text-xs text-white/55">Secure release history, withdrawal controls, trusted routing</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                  <input
                    value={walletAmount}
                    onChange={(event) => setWalletAmount(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/25"
                    placeholder="Enter amount, for example 500"
                  />
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Usage note</p>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    Approved milestone releases land here first. Withdraw from the same balance whenever you are ready to move funds out.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleWalletAction}
                  disabled={walletLoading}
                  className="rounded-2xl bg-[#00B386] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Withdraw Funds
                </button>
                <button
                  onClick={() => setActivePage('bank')}
                  className="rounded-2xl border border-white/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1020] transition hover:bg-slate-100"
                >
                  Open Bank Account
                </button>
              </div>

              {walletStatus.message ? (
                <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${walletStatus.type === 'error' ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100'}`}>
                  {walletStatus.message}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Pending releases</p>
                  <p className="mt-2 text-2xl font-bold text-white">$1,860</p>
                  <p className="mt-1 text-xs text-white/55">Waiting on client approval across 3 milestones</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Security and trust</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    <Shield className="h-3.5 w-3.5 text-emerald-300" />
                    Verification active
                  </div>
                  <p className="mt-3 text-xs text-white/55">Protected releases, verified routing, and payout history included.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Transactions</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Payout history</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {recentTransactions.length} items
            </div>
          </div>

          <div className="mt-6 flex min-h-[420px] flex-col rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 xl:h-[calc(100vh-18rem)] xl:min-h-[520px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest activity</p>
                <p className="mt-2 text-lg font-semibold text-ink">Recent payout movements</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                Live ledger
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1 xl:min-h-0">
              {recentTransactions.slice(0, 8).map((transaction, index) => {
                const tone = getTransactionTone(transaction.type);

                return (
                  <div key={`${transaction._id || transaction.createdAt || index}`} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                          {getTransactionLabel(transaction.type)}
                        </span>
                        <span className="text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {transaction.description || 'Wallet transaction recorded.'}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tone.amount}`}>
                      {tone.sign}{formatMoney(transaction.amount || 0)}
                    </span>
                  </div>
                );
              })}

              {recentTransactions.length === 0 ? (
                <div className="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center text-sm leading-6 text-slate-500">
                  No payout activity yet. Your withdrawals and released milestone payments will appear here.
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>,
    );
    return dashboardLayout(
      <div className="grid items-start gap-6 xl:h-[calc(100vh-12.5rem)] xl:grid-cols-[1.08fr_0.92fr] xl:overflow-hidden">
        <SectionCard className="p-6 xl:flex xl:h-full xl:flex-col">
          <p className="muted">Payments</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Freelancer payout center</h2>
          <div className="mt-6 rounded-[30px] bg-ink p-6 text-white xl:flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Available balance</p>
            <p className="mt-4 text-5xl font-bold tracking-tight text-white">{formatMoney(availableBalance)}</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
              Released milestone payments land here first, then you can move funds to your linked bank account.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Action amount</p>
              <input
                value={walletAmount}
                onChange={(event) => setWalletAmount(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/25"
                placeholder="Enter amount, for example 500"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleWalletAction}
                disabled={walletLoading}
                className="rounded-2xl bg-pine px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Withdraw funds
              </button>
              <button
                onClick={() => setActivePage('bank')}
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
              >
                Open bank account
              </button>
            </div>

            {walletStatus.message ? (
              <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${walletStatus.type === 'error' ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100'}`}>
                {walletStatus.message}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Usage note</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Withdrawals use the same available balance you receive from approved milestones and client releases.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 xl:flex xl:h-full xl:flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Transactions</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Payout history</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {recentTransactions.length} items
            </div>
          </div>

          <div className="mt-6 flex min-h-[420px] flex-col rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 xl:min-h-0 xl:flex-1">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest activity</p>
              <p className="mt-2 text-lg font-semibold text-ink">Latest payout movements</p>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1 xl:min-h-0">
              {recentTransactions.slice(0, 6).map((transaction, index) => {
                const tone = getTransactionTone(transaction.type);

                return (
                  <div key={`${transaction._id || transaction.createdAt || index}`} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                          {getTransactionLabel(transaction.type)}
                        </span>
                        <span className="text-xs text-slate-400">{formatTransactionTime(transaction.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {transaction.description || 'Wallet transaction recorded.'}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tone.amount}`}>
                      {tone.sign}{formatMoney(transaction.amount || 0)}
                    </span>
                  </div>
                );
              })}

              {recentTransactions.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 text-center text-sm leading-6 text-slate-500">
                  No payout activity yet. Your withdrawals and released milestone payments will appear here.
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
        userName={user?.fullName || user?.email || 'Freelancer'}
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
    if (!selectedDispute) {
      return dashboardLayout(
        <SectionCard className="p-8">
          <p className="muted">Disputes</p>
          <h2 className="mt-2 text-xl font-bold text-ink">No dispute records found</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Database dispute records will appear here when a case is opened.
          </p>
        </SectionCard>,
      );
    }

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
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="relative overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_12%_15%,rgba(0,179,134,0.34),transparent_28%),linear-gradient(135deg,#07111f,#0B1020_48%,#11223d)] p-7 text-white shadow-[0_28px_80px_rgba(11,16,32,0.22)]">
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-44 w-72 rounded-tl-[80px] bg-white/5" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Freelancer workspace
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
                  Build trust, deliver work, and track every payout clearly.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
                  Your dashboard only shows live marketplace, contract, wallet, and transaction data from the platform.
                </p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 text-right backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Available balance</p>
                <p className="mt-3 text-4xl font-bold tracking-tight">{formatMoney(availableBalance)}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/12 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Wallet ready
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <BriefcaseBusiness className="h-5 w-5 text-emerald-200" />
                <p className="mt-4 text-2xl font-bold">{recommendedJobs.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">Open jobs</p>
              </button>
              <button onClick={() => setActivePage('contracts')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <FileCheck2 className="h-5 w-5 text-sky-200" />
                <p className="mt-4 text-2xl font-bold">{activeContracts.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">Active contracts</p>
              </button>
              <button onClick={() => setActivePage('contracts')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <TrendingUp className="h-5 w-5 text-violet-200" />
                <p className="mt-4 text-2xl font-bold">{completionRate}%</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">Milestone progress</p>
              </button>
              <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <WalletCards className="h-5 w-5 text-amber-200" />
                <p className="mt-4 text-2xl font-bold">{formatMoney(pendingBalance)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">Pending escrow</p>
              </button>
            </div>
          </div>
        </div>

        <SectionCard className="flex flex-col justify-between overflow-hidden p-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">Performance</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Freelancer pulse</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Contract value</p>
                <p className="mt-3 text-2xl font-bold text-ink">{formatMoney(totalContractValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Earned</p>
                <p className="mt-3 text-2xl font-bold text-emerald-600">{formatMoney(earnedValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Completed</p>
                <p className="mt-3 text-2xl font-bold text-ink">{completedContracts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Milestones</p>
                <p className="mt-3 text-2xl font-bold text-ink">{completedMilestoneCount}/{totalMilestoneCount}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <CircleCheckBig className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">Protected work mode is active</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Milestone submissions, escrow releases, and payout history stay connected in one workflow.</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="muted">Work queue</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Active contracts</h2>
            </div>
            <button onClick={() => setActivePage('contracts')} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              View contracts
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {activeContracts.slice(0, 4).map((contract) => (
              <button
                key={contract.id}
                onClick={() => {
                  setSelectedContractId(`${contract.id}`);
                  setActivePage('contracts');
                }}
                className="group w-full rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-ink">{contract.title.en}</h3>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{contract.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Budget</p>
                      <p className="mt-1 font-bold text-ink">{contract.budget}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Progress</p>
                      <p className="mt-1 font-bold text-emerald-600">{contract.progress}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all group-hover:from-emerald-400" style={{ width: `${contract.progress}%` }} />
                </div>
              </button>
            ))}

            {activeContracts.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" />
                <h3 className="mt-4 text-lg font-bold text-ink">No active contracts yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Accepted jobs from MongoDB will appear here once you start working with a client.</p>
                <button onClick={() => setActivePage('marketplace')} className="mt-5 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Browse marketplace
                </button>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Money flow</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Recent payout signal</h2>
            </div>
            <CircleDollarSign className="h-6 w-6 text-pine" />
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex h-48 items-end gap-3">
              {transactionBars.length > 0 ? transactionBars.map((transaction, index) => {
                const height = Math.max(18, Math.round(((transaction.amount || 0) / maxTransactionAmount) * 100));
                return (
                  <div key={`${transaction._id || transaction.createdAt || index}-bar`} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-36 w-full items-end rounded-full bg-white p-1 shadow-inner">
                      <div
                        className={`w-full rounded-full ${transaction.type === 'withdrawal' ? 'bg-amber-400' : 'bg-gradient-to-t from-pine to-emerald-300'}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{formatTransactionTime(transaction.createdAt).split(',')[0]}</span>
                  </div>
                );
              }) : (
                <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center text-sm leading-6 text-slate-500">
                  No transaction chart yet. Released payments and withdrawals will draw this chart automatically.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentTransactions.slice(0, 3).map((transaction, index) => {
              const tone = getTransactionTone(transaction.type);
              return (
                <div key={`${transaction._id || transaction.createdAt || index}-dashboard`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{getTransactionLabel(transaction.type)}</p>
                    <p className="truncate text-sm text-slate-500">{transaction.description || 'Wallet transaction recorded.'}</p>
                  </div>
                  <p className={`shrink-0 font-bold ${tone.amount}`}>{tone.sign}{formatMoney(transaction.amount || 0)}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">Next steps</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Upcoming milestones</h2>
            </div>
            <CalendarClock className="h-6 w-6 text-indigo-500" />
          </div>

          <div className="mt-6 space-y-3">
            {nextMilestones.map((milestone, index) => (
              <div key={`${milestone.contractId}-${milestone.title.en}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{milestone.title.en}</p>
                    <p className="mt-1 text-sm text-slate-500">{milestone.contractTitle}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{milestone.status}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Due {milestone.dueDate}</span>
                  <span className="font-bold text-ink">{milestone.amount}</span>
                </div>
              </div>
            ))}

            {nextMilestones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                No pending milestones right now. When a contract has work to submit, it will show up here.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="muted">Marketplace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Fresh opportunities</h2>
            </div>
            <button onClick={() => setActivePage('marketplace')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pine hover:text-pine">
              Explore jobs
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {recommendedJobs.map((job) => (
              <button
                key={job.id || job.title}
                onClick={() => navigate(`/freelancer-jobs/${job.id || job.title}`)}
                className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{job.category || 'Job'}</span>
                <h3 className="mt-4 line-clamp-2 text-base font-bold text-ink">{job.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{job.client}</p>
                <p className="mt-5 text-xl font-bold text-ink">{job.budget}</p>
              </button>
            ))}

            {recommendedJobs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500 lg:col-span-3">
                No open marketplace jobs from the database yet.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>
    </div>,
  );
}

export default FreelancerDashboard;

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, CircleDollarSign, ClipboardCheck, Download, Eye, FileCheck2, FileUp, Landmark, MessageSquareMore, PencilLine, Plus, Receipt, Search, Send, Shield, ShieldCheck, Trash2, Users, Wallet, X, XCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import AppErrorBoundary from '../components/AppErrorBoundary';
import PaymentCenter from '../components/PaymentCenter';
import ReviewPanel from '../components/ReviewPanel';
import DisputeCenter from '../features/disputes/DisputeCenter';
import { contracts, freelancerProfiles, sidebarItems } from '../data/appData';
import { createContractFromAcceptedJob, normalizeContractForView, sortContractsByWorkState } from '../utils/contractTransforms';
import { persistLanguage } from '../utils/language';
import { formatMoney, parseMoneyAmount } from '../utils/money';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';
const VIETQR_BANKS_API = 'https://api.vietqr.io/v2/banks';
const FALLBACK_VN_BANKS = [
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'VTB', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
];
const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
function getLabels(language) {
  if (language === 'vi') {
    return {
      Dashboard: 'Tổng quan',
      Profile: 'Hồ sơ',
      Jobs: 'Công việc',
      Contracts: 'Hợp đồng',
      Chat: 'Trò chuyện',
      'Bank Account': 'Tài khoản ngân hàng',
      Payments: 'Thanh toán',
      Disputes: 'Tranh chấp',
      workspace: 'Không gian làm việc',
      trustCenter: 'Bảng điều khiển khách hàng',
      workspaceDesc: 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.',
      balanceProtected: 'Số dư khả dụng',
      balanceDesc: 'Số dư dùng chung cho các hợp đồng với đối tác của bạn.',
    };
  }

  return {
    Dashboard: 'Dashboard',
    Profile: 'Profile',
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
}

function getTitles(language) {
  if (language === 'vi') {
    return {
      dashboard: 'Bảng điều khiển khách hàng',
      marketplace: 'Thị trường nhân sự',
      contracts: 'Hợp đồng khách hàng',
      chat: 'Trò chuyện khách hàng',
      bank: 'Tài khoản ngân hàng',
      escrow: 'Thanh toán',
      disputes: 'Tranh chấp',
      settings: 'Cài đặt',
    };
  }

  return {
    dashboard: 'Client Dashboard',
    marketplace: 'Talent Marketplace',
    contracts: 'Client Contracts',
    chat: 'Client Chat',
    bank: 'Bank Account',
    escrow: 'Payments',
    disputes: 'Disputes',
    settings: 'Settings',
  };
}

function getCleanLabels(language) {
  if (language === 'vi') {
    return {
      Dashboard: 'Tổng quan',
      Profile: 'Hồ sơ',
      Jobs: 'Công việc',
      Contracts: 'Hợp đồng',
      Chat: 'Trò chuyện',
      'Bank Account': 'Tài khoản ngân hàng',
      Payments: 'Thanh toán',
      Disputes: 'Tranh chấp',
      workspace: 'Không gian làm việc',
      trustCenter: 'Bảng điều khiển khách hàng',
      workspaceDesc: 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.',
      balanceProtected: 'Số dư khả dụng',
      balanceDesc: 'Số dư dùng chung cho các hợp đồng với đối tác của bạn.',
    };
  }

  return getLabels(language);
}

function getCleanTitles(language) {
  if (language === 'vi') {
    return {
      dashboard: 'Bảng điều khiển khách hàng',
      marketplace: 'Thị trường nhân sự',
      contracts: 'Hợp đồng khách hàng',
      chat: 'Trò chuyện khách hàng',
      bank: 'Tài khoản ngân hàng',
      escrow: 'Thanh toán',
      disputes: 'Tranh chấp',
      settings: 'Cài đặt',
    };
  }

  return getTitles(language);
}
const clientActivities = [
  {
    title: { en: 'Proposal shortlist updated', vi: 'Danh sách chào giá đã được cập nhật' },
    description: {
      en: '3 freelancers were moved to the final review stage for the dashboard redesign role.',
      vi: '3 freelancer đã được đưa vào vòng đánh giá cuối cho vị trí thiết kế lại bảng điều khiển.',
    },
    time: { en: '20 minutes ago', vi: '20 phút trước' },
    icon: Users,
  },
  {
    title: { en: 'Milestone awaiting approval', vi: 'Milestone đang chờ phê duyệt' },
    description: {
      en: 'Prototype & Animations was submitted and is waiting for your review.',
      vi: 'Prototype & Animations đã được gửi và đang chờ bạn xem xét.',
    },
    time: { en: '2 hours ago', vi: '2 giờ trước' },
    icon: ClipboardCheck,
  },
  {
    title: { en: 'Balance updated successfully', vi: 'Số dư đã được cập nhật thành công' },
    description: {
      en: 'A new payment action was confirmed for the mobile app design contract.',
      vi: 'Một thao tác thanh toán mới đã được xác nhận cho hợp đồng thiết kế ứng dụng di động.',
    },
    time: { en: 'Yesterday', vi: 'Hôm qua' },
    icon: Shield,
  },
];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('fptp_user') || '{}');
  } catch {
    return {};
  }
}

function persistStoredUser(nextUser) {
  localStorage.setItem('fptp_user', JSON.stringify(nextUser));
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

function getTransactionLabel(type, language = 'en') {
  if (type === 'deposit') return language === 'vi' ? 'Nạp tiền' : 'Deposit';
  if (type === 'release') return language === 'vi' ? 'Giải ngân' : 'Release payment';
  if (type === 'withdrawal') return language === 'vi' ? 'Rút tiền' : 'Withdrawal';
  if (type === 'refund') return language === 'vi' ? 'Hoàn tiền' : 'Refund';
  if (type === 'platform_fee') return language === 'vi' ? 'Phí nền tảng' : 'Platform fee';
  return language === 'vi' ? 'Giao dịch' : 'Transaction';
}

function getTransactionTone(type) {
  if (type === 'deposit') {
    return {
      badge: 'bg-emerald-50 text-emerald-700',
      amount: 'text-emerald-600',
      sign: '+',
    };
  }

  if (type === 'release' || type === 'withdrawal' || type === 'platform_fee') {
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

function formatTransactionTime(value, language = 'en') {
  if (!value) return language === 'vi' ? 'Vừa xong' : 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'vi' ? 'Vừa xong' : 'Just now';

  return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function localizeContractStatus(status, language) {
  if (language !== 'vi') return status;
  if (status === 'Approved') return 'Đã duyệt';
  if (status === 'Completed') return 'Thành công';
  if (status === 'In Progress') return 'Đang thực hiện';
  if (status === 'Pending') return 'Chờ xử lý';
  if (status === 'Active') return 'Đang hoạt động';
  if (status === 'Declined') return 'Bị từ chối';
  return status;
}

function contractStatusTone(status) {
  if (status === 'Declined') return 'bg-rose-100 text-rose-700';
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
  return 'bg-indigo-100 text-indigo-700';
}

function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(readStoredUser);
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [availableBalance, setAvailableBalance] = useState(() => Number(user?.balance || 0));
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
  const [sepayPayment, setSepayPayment] = useState(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpSuccessNotice, setTopUpSuccessNotice] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ bankName: '', accountNumber: '', accountName: '', amount: '' });
  const [bankOptions, setBankOptions] = useState(FALLBACK_VN_BANKS);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [reviewModal, setReviewModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [signatureModal, setSignatureModal] = useState({ open: false, contract: null });
  const [contractSignature, setContractSignature] = useState(user?.companyName || user?.fullName || '');
  const [contractSignatureImage, setContractSignatureImage] = useState('');
  const [signingContract, setSigningContract] = useState(false);
  const [contractReviewModal, setContractReviewModal] = useState({ open: false, contract: null, milestoneIndex: -1, recipientId: '', recipientName: '' });
  const [reviewZoom, setReviewZoom] = useState(1);
  const [reviewPan, setReviewPan] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const language = user?.settings?.language || 'en';
  const labels = getCleanLabels(language);
  const titles = getCleanTitles(language);
  const topbarSubtitle = language === 'vi'
    ? 'Không gian khách hàng cho phê duyệt, thanh toán và quản lý đối tác'
    : 'Client workspace for approvals, payments, and supplier management';
  const topbarCopy = {
    role: language === 'vi' ? 'khách hàng' : 'client',
    logout: language === 'vi' ? 'Đăng xuất' : 'Logout',
  };

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

  const fetchEscrowSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('fptp_token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/escrow/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.summary) {
        if (data.summary.balance !== undefined) {
          const nextBalance = data.summary.balance;
          setAvailableBalance(nextBalance);
          setUser((currentUser) => {
            const nextUser = { ...currentUser, balance: nextBalance };
            persistStoredUser(nextUser);
            return nextUser;
          });
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
  }, []);

  useEffect(() => {
    fetchEscrowSummary();
  }, [fetchEscrowSummary, activePage]);

  useEffect(() => {
    let isMounted = true;

    const fetchVietnameseBanks = async () => {
      try {
        const response = await fetch(VIETQR_BANKS_API);
        const data = await response.json().catch(() => ({}));
        const banks = Array.isArray(data?.data) ? data.data : [];
        const normalizedBanks = banks
          .map((bank) => ({
            code: bank.code || bank.bin || bank.shortName,
            shortName: bank.shortName || bank.code || bank.name,
            name: bank.name || bank.shortName || bank.code,
          }))
          .filter((bank) => bank.code && bank.shortName)
          .sort((left, right) => left.shortName.localeCompare(right.shortName));

        if (isMounted && normalizedBanks.length > 0) {
          setBankOptions(normalizedBanks);
        }
      } catch (error) {
        console.error('Failed to fetch Vietnamese banks:', error);
      }
    };

    fetchVietnameseBanks();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const hasPendingSepay = Boolean(sepayPayment?.paymentCode)
      || recentTransactions.some(
        (transaction) => transaction?.paymentProvider === 'sepay' && transaction?.status === 'pending',
      );

    if (activePage !== 'escrow' || !hasPendingSepay) {
      return undefined;
    }

    const intervalId = window.setInterval(fetchEscrowSummary, 5000);
    return () => window.clearInterval(intervalId);
  }, [activePage, fetchEscrowSummary, recentTransactions]);

  useEffect(() => {
    if (!sepayPayment?.paymentCode) {
      return;
    }

    const completedTopUp = recentTransactions.find(
      (transaction) =>
        transaction?.paymentProvider === 'sepay'
        && transaction?.status === 'completed'
        && transaction?.paymentCode === sepayPayment.paymentCode,
    );

    if (!completedTopUp) {
      return;
    }

    setTopUpModalOpen(false);
    setSepayPayment(null);
    setTopUpSuccessNotice(
      language === 'vi'
        ? `Nạp ví thành công ${formatMoney(completedTopUp.amount || 0)}.`
        : `Wallet top-up successful: ${formatMoney(completedTopUp.amount || 0)}.`,
    );
  }, [language, recentTransactions, sepayPayment]);

  useEffect(() => {
    if (!topUpSuccessNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setTopUpSuccessNotice(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [topUpSuccessNotice]);

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

  useEffect(() => {
    const refreshClientData = () => {
      if (document.hidden) return;
      fetchMyJobs();
      fetchEscrowSummary();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshClientData();
    };

    const handleRealtimeNotification = (event) => {
      const page = event.detail?.actionPage;
      if (!page || ['contracts', 'marketplace', 'escrow', 'disputes'].includes(page)) {
        refreshClientData();
      }
    };

    const intervalId = window.setInterval(refreshClientData, 5000);
    window.addEventListener('focus', refreshClientData);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('fptp:notification', handleRealtimeNotification);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshClientData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('fptp:notification', handleRealtimeNotification);
    };
  }, [fetchEscrowSummary, fetchMyJobs]);

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
    .filter((job) => {
      if (job.status === 'assigned') {
        return true;
      }

      if (job.status !== 'open') {
        return false;
      }

      const hasDeclinedAcceptedContract = Array.isArray(job.proposals)
        && job.proposals.some((proposal) => `${proposal.status || ''}`.toLowerCase() === 'declined')
        && (job.onlineContract || job.acceptedAt);

      return hasDeclinedAcceptedContract;
    })
    .map((job) => {
      const declinedProposal = Array.isArray(job.proposals)
        ? job.proposals.find((proposal) => `${proposal.status || ''}`.toLowerCase() === 'declined')
        : null;

      return createContractFromAcceptedJob({
        ...job,
        freelancerProposalStatus: declinedProposal ? 'declined' : job.freelancerProposalStatus,
        assignedFreelancerId: job.assignedFreelancerId || declinedProposal?.freelancerId || '',
        assignedFreelancerName: job.assignedFreelancerName || declinedProposal?.freelancerName || '',
      });
    });
  const contractList = sortContractsByWorkState(acceptedContracts.map((contract, index) => normalizeContractForView(contract, index)));
  const selectedClientContract = contractList.find((item) => `${item.id}` === `${selectedContractId}`) ?? contractList[0];
  const selectedContractLastApprovedMilestoneIndex = selectedClientContract
    ? [...selectedClientContract.milestones]
        .map((milestone, index) => ({ milestone, index }))
        .filter(({ milestone }) => milestone.status === 'Approved')
        .map(({ index }) => index)
        .pop()
    : -1;
  const isSelectedClientContractCompleted = Boolean(
    selectedClientContract
    && (
      selectedClientContract.status === 'Completed'
      || selectedClientContract.milestones.every((milestone) => milestone.status === 'Approved')
    ),
  );
  const canReviewFreelancer = Boolean(
    selectedClientContract?.sourceJobId
    && selectedClientContract?.assignedFreelancerId
    && isSelectedClientContractCompleted
    && selectedContractLastApprovedMilestoneIndex >= 0,
  );
  const activePostedJobs = postedJobs.filter((job) => (
    job.status !== 'closed'
    && job.contractState?.status !== 'Completed'
  ));
  const postedJobsCount = postedJobs.length;
  const activeContractsCount = contractList.filter((contract) => contract.status === 'Active').length;
  const filteredBankOptions = bankOptions.filter((bank) => {
    const keyword = withdrawForm.bankName.toLowerCase().trim();
    if (!keyword) return true;
    return `${bank.shortName} ${bank.name} ${bank.code}`.toLowerCase().includes(keyword);
  });

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
    persistLanguage(language);
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

  const handleSidebarNavigate = (page) => {
    if (page === 'profile') {
      navigate(`/client-profile/${user?.id || user?._id || 'me'}`, {
        state: {
          profileSeed: {
            id: user?.id || user?._id || '',
            fullName: user?.fullName || user?.companyName || user?.email || '',
            email: user?.email || '',
          },
        },
      });
      return;
    }

    setActivePage(page);
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

  const closeSignatureModal = () => {
    setSignatureModal({ open: false, contract: null });
    setContractSignature(user?.companyName || user?.fullName || '');
    setContractSignatureImage('');
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getSignaturePoint = (event) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pointer = event.touches?.[0] || event;
    return {
      x: ((pointer.clientX - rect.left) / rect.width) * canvas.width,
      y: ((pointer.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startSignatureDraw = (event) => {
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    signatureDrawingRef.current = true;
    const context = canvas.getContext('2d');
    const point = getSignaturePoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const drawSignature = (event) => {
    if (!signatureDrawingRef.current) return;
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getSignaturePoint(event);
    context.lineTo(point.x, point.y);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  };

  const stopSignatureDraw = () => {
    signatureDrawingRef.current = false;
  };

  useEffect(() => {
    if (!signatureModal.open) return;
    const timeoutId = window.setTimeout(clearSignatureCanvas, 50);
    return () => window.clearTimeout(timeoutId);
  }, [signatureModal.open]);

  const signOnlineContract = async (contract) => {
    if (!contract?.sourceJobId) {
      setContractFeedback({ type: 'error', message: 'This contract is not linked to a database job.' });
      return;
    }

    if (!contractSignature.trim()) {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập họ tên hoặc tên công ty để ký hợp đồng.' : 'Please enter your name or company name to sign.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setContractFeedback({ type: 'error', message: 'Please log in again before signing.' });
      return;
    }

    if (!contractSignatureImage) {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Vui lòng upload ảnh chữ ký trước khi xác nhận.' : 'Please upload a signature image before confirming.' });
      return;
    }

    setSigningContract(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/contract/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: contractSignature.trim(), signatureImage: contractSignatureImage }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setContractFeedback({ type: 'error', message: data.message || 'Could not sign this contract.' });
        return;
      }

      setPostedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${data.job.id}` ? data.job : job)));
      closeSignatureModal();
      setContractFeedback({
        type: 'success',
        message: data.job?.onlineContract?.status === 'signed'
          ? (language === 'vi' ? 'Hai bên đã ký hợp đồng. Công việc có thể bắt đầu.' : 'Both parties signed the contract. Work can begin.')
          : (language === 'vi' ? 'Client đã ký hợp đồng. Đang chờ freelancer ký.' : 'Client signature submitted. Waiting for freelancer signature.'),
      });
      await fetchMyJobs();
    } catch (error) {
      console.error('Failed to sign contract:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while signing this contract.' });
    } finally {
      setSigningContract(false);
    }
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Vui lòng chọn tệp hình ảnh chữ ký.' : 'Please choose an image file for the signature.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setContractSignatureImage(`${reader.result || ''}`);
    reader.readAsDataURL(file);
  };

  const downloadOnlineContract = async (contract) => {
    if (!contract?.sourceJobId) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const response = await fetch(`${API_BASE_URL}/jobs/${contract.sourceJobId}/contract/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Không thể tải hợp đồng.' : 'Could not download the contract.' });
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contract.title?.[language] || contract.onlineContract?.title || 'online-contract'}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
      const refundedAmount = data.refundedAmount || 0;
      setAvailableBalance((current) => {
        const nextBalance = current + refundedAmount;
        setUser((currentUser) => {
          const nextUser = { ...currentUser, balance: nextBalance };
          persistStoredUser(nextUser);
          return nextUser;
        });
        return nextBalance;
      });
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
      const refundedAmount = data.refundedAmount || 0;
      setAvailableBalance((current) => {
        const nextBalance = current + refundedAmount;
        setUser((currentUser) => {
          const nextUser = { ...currentUser, balance: nextBalance };
          persistStoredUser(nextUser);
          return nextUser;
        });
        return nextBalance;
      });
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
  const releaseAmount = parseMoneyAmount(walletAmount);
    setWalletStatus({ type: '', message: '' });
    setSepayPayment(null);

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
      setSepayPayment(data.payment || null);
      setWalletAmount('');
      setWalletStatus({ type: 'success', message: 'Payment released successfully.' });

      const nextUser = {
        ...user,
        balance: data.summary?.balance ?? availableBalance,
      };
      setUser(nextUser);
      persistStoredUser(nextUser);
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
  const topUpAmount = parseMoneyAmount(walletAmount);
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

      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }
      setSepayPayment(data.payment || null);
      setTopUpModalOpen(true);
      setWalletAmount('');
      const transferContent = data.payment?.transferContent || data.payment?.paymentCode || '';
      const bankLabel = data.payment?.bankName || data.payment?.bankCode || 'SePay';
      const accountNo = data.payment?.accountNumber || '';
      const amountLabel = data.payment?.amountLabel || formatMoney(topUpAmount);
      setWalletStatus({
        type: 'success',
        message: `SePay pending: Chuyển ${amountLabel} tới ${bankLabel} ${accountNo ? `(${accountNo})` : ''}, nội dung "${transferContent}". Số dư sẽ cập nhật tự động sau khi webhook xác nhận.`,
      });
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not top up balance.',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = Number(withdrawForm.amount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập số tiền rút hợp lệ.' : 'Please enter a valid withdrawal amount.' });
      return;
    }
    if (!withdrawForm.bankName.trim() || !withdrawForm.accountNumber.trim() || !withdrawForm.accountName.trim()) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập đầy đủ ngân hàng, số tài khoản và tên chủ tài khoản.' : 'Please enter bank name, account number, and account holder.' });
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng đăng nhập lại trước khi rút tiền.' : 'Please log in again before withdrawing.' });
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
        body: JSON.stringify({
          amount,
          bankName: withdrawForm.bankName.trim(),
          accountNumber: withdrawForm.accountNumber.trim(),
          accountName: withdrawForm.accountName.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || (language === 'vi' ? 'Không thể tạo yêu cầu rút tiền.' : 'Could not create withdrawal request.'));
      }

      const nextBalance = data.summary?.balance ?? availableBalance;
      setAvailableBalance(nextBalance);
      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }

      setWithdrawForm({ bankName: '', accountNumber: '', accountName: '', amount: '' });
      setWalletAmount('');
      setWithdrawModalOpen(false);
      setWalletStatus({
        type: 'success',
        message: language === 'vi'
          ? 'Yêu cầu rút tiền đã được tạo và đang chờ admin duyệt.'
          : 'Withdrawal request created and pending admin approval.',
      });

      const nextUser = { ...user, balance: nextBalance };
      setUser(nextUser);
      persistStoredUser(nextUser);
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : (language === 'vi' ? 'Không thể tạo yêu cầu rút tiền.' : 'Could not create withdrawal request.'),
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const topUpPaymentModal = topUpModalOpen && sepayPayment ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">SePay</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {language === 'vi' ? 'Quét QR để nạp ví' : 'Scan QR to top up'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'vi' ? 'Chuyển đúng nội dung để hệ thống tự cộng tiền sau webhook.' : 'Use the exact transfer content so the wallet updates automatically.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTopUpModalOpen(false)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label={language === 'vi' ? 'Đóng' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {sepayPayment.qrUrl ? (
              <img src={sepayPayment.qrUrl} alt="SePay QR" className="h-52 w-52 rounded-2xl bg-white object-contain p-2 shadow-sm" />
            ) : (
              <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
                {language === 'vi' ? 'Chưa tạo được QR' : 'QR not available'}
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {[
              [language === 'vi' ? 'Ngân hàng' : 'Bank', sepayPayment.bankName || sepayPayment.bankCode],
              [language === 'vi' ? 'Số tài khoản' : 'Account number', sepayPayment.accountNumber],
              [language === 'vi' ? 'Tên tài khoản' : 'Account name', sepayPayment.accountName],
              [language === 'vi' ? 'Số tiền' : 'Amount', sepayPayment.amountLabel || formatMoney(sepayPayment.amount || 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <p className="mt-1 font-semibold text-slate-900">{value || '-'}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                {language === 'vi' ? 'Nội dung chuyển khoản' : 'Transfer content'}
              </p>
              <p className="mt-1 break-all text-lg font-bold text-emerald-800">{sepayPayment.transferContent || sepayPayment.paymentCode}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
          {sepayPayment.qrUrl ? (
            <a
              href={sepayPayment.qrUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {language === 'vi' ? 'Mở QR' : 'Open QR'}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setTopUpModalOpen(false)}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            {language === 'vi' ? 'Đã hiểu' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const dashboardLayout = (content) => (
    <div className={`${activePage === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-100/80`}>
      {topUpSuccessNotice ? (
        <div className="fixed left-1/2 top-4 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-sm font-semibold text-emerald-700 shadow-[0_18px_50px_rgba(16,185,129,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <span>{topUpSuccessNotice}</span>
            <button
              type="button"
              onClick={() => setTopUpSuccessNotice('')}
              className="rounded-full p-1 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
              aria-label={language === 'vi' ? 'Đóng thông báo' : 'Close notification'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className={`mx-auto flex w-full gap-4 px-3 py-4 sm:gap-5 sm:px-5 xl:gap-6 xl:px-6 ${activePage === 'chat' ? 'h-full overflow-hidden' : ''}`}>
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={handleSidebarNavigate} labels={labels} balanceValue={formatMoney(availableBalance)} />
        <div className={`min-w-0 flex-1 ${activePage === 'chat' ? 'flex min-h-0 flex-col space-y-4 overflow-hidden' : 'space-y-6'}`}>
          <Topbar
            title={titles[activePage]}
            subtitle={language === 'vi' ? 'Không gian khách hàng cho phê duyệt, thanh toán và quản lý đối tác' : 'Client workspace for approvals, protected payments, and supplier management'}
            onLogout={logout}
            onOpenSettings={() => {
              setSettingsSection('profile');
              setActivePage('settings');
            }}
            onOpenBankSettings={() => {
              setActivePage('bank');
            }}
            onOpenKycSettings={() => {
              setSettingsSection('kyc');
              setActivePage('settings');
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
            copy={{ role: language === 'vi' ? 'khách hàng' : 'client', logout: language === 'vi' ? 'Đăng xuất' : 'Logout' }}
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
      {topUpPaymentModal}
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
              <p className="muted">{language === 'vi' ? 'Thị trường freelancer' : 'Talent Marketplace'}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                {language === 'vi' ? 'Hồ sơ freelancer sẵn sàng để khách hàng xem xét' : 'Freelancer profiles ready for client review'}
              </h2>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={language === 'vi' ? 'Tìm freelancer hoặc brief' : 'Search talent or briefs'}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-60"
              />
            </label>
          </div>
        </SectionCard>
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="muted">{language === 'vi' ? 'Tin tuyển dụng của bạn' : 'Your job posts'}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                {language === 'vi' ? 'Tạo và quản lý brief tuyển dụng' : 'Create and manage hiring briefs'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {language === 'vi'
                  ? 'Mở bất kỳ công việc nào đã đăng để xem toàn bộ brief, và tạo công việc mới từ trang riêng.'
                  : 'Open any posted role to review the full brief, and create new jobs from a dedicated page.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/client-jobs/new')}
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {language === 'vi' ? 'Thêm công việc' : 'Add Job'}
            </button>
          </div>
          {jobStatus.message ? (
            <p className={`mt-6 rounded-2xl px-4 py-3 text-sm ${jobStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {jobStatus.message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-5">
            {activePostedJobs.map((job) => (
              <div key={job.id} className="space-y-3">
                <JobCard
                  job={job}
                  labels={{ budget: language === 'vi' ? 'Ngân sách' : 'Budget', client: language === 'vi' ? 'Khách hàng' : 'Client' }}
                  actionLabel={language === 'vi' ? 'Xem công việc' : 'View Job'}
                  onAction={() => navigate(`/client-jobs/${job.id}`)}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/client-jobs/${job.id}/edit`)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <PencilLine className="h-4 w-4" />
                    {language === 'vi' ? 'Sửa công việc' : 'Edit Job Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClientJob(job.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {language === 'vi' ? 'Xóa công việc' : 'Delete Job'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activePostedJobs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              {language === 'vi' ? 'Không còn công việc đang mở hoặc đang thực hiện. Các job đã hoàn tất nằm trong phần Hợp đồng.' : 'No open or active jobs remain. Completed jobs stay in Contracts.'}
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
                client: `${item.rating} đánh giá · ${item.completedJobs} công việc`,
                category: item.specialty,
                description: item.headline,
              }}
              labels={{ budget: 'Rate', client: 'Track record' }}
              actionLabel="View Profile"
              onAction={() => navigate(`/freelancer-profile/${item.id}`, {
                state: {
                  profileSeed: {
                    ...item,
                    id: item.id,
                    fullName: item.fullName,
                    headline: item.headline,
                    rating: item.rating,
                    totalReviews: item.completedJobs,
                  },
                },
              })}
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
          <h2 className="mt-2 text-xl font-bold text-ink">{language === 'vi' ? 'Chưa có hợp đồng nào' : 'No contracts available yet'}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Accepted jobs and active supplier agreements will appear here once work is in progress.
          </p>
        </SectionCard>,
      );
    }

    const requiresClientSignature = selectedClientContract.onlineContract?.status === 'pending_signature'
      && !selectedClientContract.onlineContract?.clientSignature;
    const isOnlineContractSigned = selectedClientContract.onlineContract?.status === 'signed';

    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Hợp đồng khách hàng' : 'Client contracts'}</h2>
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
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-semibold text-ink">{contract.title?.[language] || contract.title?.vi || contract.title?.en}</p>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${contractStatusTone(contract.status)}`}>
                    {localizeContractStatus(contract.status, language)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <div className="space-y-5">
          {isOnlineContractSigned ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {language === 'vi'
                ? `Hợp đồng online đã đủ chữ ký: client ${selectedClientContract.onlineContract.clientSignature || 'client'} và freelancer ${selectedClientContract.onlineContract.freelancerSignature || 'freelancer'}.`
                : `Online contract signed by client ${selectedClientContract.onlineContract.clientSignature || 'client'} and freelancer ${selectedClientContract.onlineContract.freelancerSignature || 'freelancer'}.`}
            </div>
          ) : selectedClientContract.onlineContract ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {language === 'vi'
                ? `Hợp đồng đang chờ chữ ký: ${selectedClientContract.onlineContract.clientSignature ? 'còn freelancer' : 'còn client'} cần ký.`
                : `Contract is waiting for signature: ${selectedClientContract.onlineContract.clientSignature ? 'freelancer' : 'client'} still needs to sign.`}
            </div>
          ) : null}
          <SectionCard className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-ink">{selectedClientContract.title?.[language] || selectedClientContract.title?.vi || selectedClientContract.title?.en}</h3>
                <p className="mt-2 text-slate-500">{selectedClientContract.client}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                {selectedClientContract.onlineContract ? (
                  <button
                    type="button"
                    onClick={() => downloadOnlineContract(selectedClientContract)}
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    {language === 'vi' ? 'Tải hợp đồng Word' : 'Download Word'}
                  </button>
                ) : null}
                {requiresClientSignature ? (
                  <button
                    type="button"
                    onClick={() => setSignatureModal({ open: true, contract: selectedClientContract })}
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {language === 'vi' ? 'Ký hợp đồng' : 'Sign Contract'}
                  </button>
                ) : null}
                {canReviewFreelancer ? (
                  <button
                    type="button"
                    onClick={() => setContractReviewModal({
                      open: true,
                      contract: selectedClientContract,
                      milestoneIndex: selectedContractLastApprovedMilestoneIndex,
                      recipientId: selectedClientContract.assignedFreelancerId,
                      recipientName: selectedClientContract.assignedFreelancerName || selectedClientContract.client,
                    })}
                    className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  >
                    <MessageSquareMore className="h-4 w-4" />
                    {language === 'vi' ? 'Đánh giá freelancer' : 'Review freelancer'}
                  </button>
                ) : null}
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
              <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Ngân sách đã duyệt' : 'Approved budget'}</p><p className="mt-2 text-2xl font-bold text-ink">{selectedClientContract.budget}</p></div>
              <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Đã giải ngân' : 'Released so far'}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedClientContract.earned}</p></div>
              <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Tiến độ' : 'Progress'}</p><p className="mt-2 text-2xl font-bold text-ink">{selectedClientContract.progress}%</p></div>
            </div>
            <div className="mt-8 space-y-4">
              {selectedClientContract.milestones.map((milestone, milestoneIndex) => (
                <div key={milestone.title?.[language] || milestone.title?.vi || milestone.title?.en} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-ink">{milestone.title?.[language] || milestone.title?.vi || milestone.title?.en}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{localizeContractStatus(milestone.status, language)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{language === 'vi' ? 'Hạn' : 'Due'} {milestone.dueDate} · {milestone.amount}</p>
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
                          {language === 'vi' ? (milestone.reviewAction === 'View Brief' ? 'Xem brief' : milestone.reviewAction === 'View Product' ? 'Xem sản phẩm' : milestone.reviewAction === 'View Draft' ? 'Xem bản nháp' : milestone.reviewAction === 'Review Product' ? 'Xem sản phẩm' : milestone.reviewAction) : milestone.reviewAction}
                        </button>
                      ) : null}
                      {(milestone.action === 'Approve' || milestone.reviewAction === 'Review Product') ? (
                        <button
                          onClick={() => openReviewModal(selectedClientContract, milestone, milestoneIndex)}
                          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <MessageSquareMore className="h-4 w-4" />
                          {language === 'vi' ? 'Xem sản phẩm' : 'Review Product'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        {signatureModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">{language === 'vi' ? 'Ký hợp đồng online' : 'Online contract signature'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{signatureModal.contract?.onlineContract?.title || signatureModal.contract?.title?.[language]}</h3>
                </div>
                <button onClick={closeSignatureModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid max-h-[calc(92vh-92px)] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{signatureModal.contract?.onlineContract?.content || ''}</pre>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Tên client / công ty' : 'Client / company name'}</label>
                    <input
                      value={contractSignature}
                      onChange={(event) => setContractSignature(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                      placeholder={language === 'vi' ? 'Nhập tên để ký' : 'Enter name to sign'}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Upload ảnh chữ ký' : 'Upload signature image'}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                    {contractSignatureImage ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{language === 'vi' ? 'Preview chữ ký' : 'Signature preview'}</p>
                        <img src={contractSignatureImage} alt="Signature preview" className="max-h-36 w-full rounded-xl bg-white object-contain p-2" />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => signOnlineContract(signatureModal.contract)}
                    disabled={signingContract}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {signingContract ? (language === 'vi' ? 'Đang ký...' : 'Signing...') : (language === 'vi' ? 'Xác nhận ký hợp đồng' : 'Confirm signature')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {reviewModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-6xl rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{language === 'vi' ? 'Xem sản phẩm đã nộp' : 'Review milestone delivery'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{reviewModal.milestone?.title?.[language] || reviewModal.milestone?.title?.vi || reviewModal.milestone?.title?.en}</h3>
                  <p className="mt-2 text-sm text-slate-500">{language === 'vi' ? 'Xem bài nộp của freelancer trước khi phê duyệt giai đoạn này.' : 'Review the freelancer submission before approving this stage.'}</p>
                </div>
                <button onClick={closeReviewModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {reviewModal.milestone?.submission?.fileDataUrl ? (
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Xem trực tiếp' : 'Live preview'}</p>
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
                        <p className="font-semibold text-slate-700">{reviewModal.milestone.submission.fileName || (language === 'vi' ? 'Tệp đã nộp' : 'Submitted file')}</p>
                        <p className="text-sm">{language === 'vi' ? 'Loại tệp này hiện chưa hỗ trợ xem trực tiếp, nhưng bạn có thể tải xuống bên dưới.' : 'Preview is not available for this file type yet, but you can download the attachment below.'}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Ghi chú của freelancer' : 'Freelancer note'}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{reviewModal.milestone.submission.note || (language === 'vi' ? 'Chưa có ghi chú bàn giao nào.' : 'No delivery note was provided.')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Tệp đính kèm' : 'Attachment'}</p>
                      <p className="mt-2 text-sm text-slate-500">{reviewModal.milestone.submission.fileName || (language === 'vi' ? 'Chưa có tệp đính kèm' : 'No file attached')}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={reviewModal.milestone.submission.fileDataUrl}
                        download={reviewModal.milestone.submission.fileName || 'submission'}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                      >
                        <Download className="h-4 w-4" />
                        {language === 'vi' ? 'Tải tệp' : 'Download file'}
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
                          {language === 'vi' ? 'Phê duyệt milestone' : 'Approve milestone'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeSubmittedFile(reviewModal.contract, reviewModal.milestoneIndex)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        <XCircle className="h-4 w-4" />
                        {language === 'vi' ? 'Xóa tệp' : 'Remove file'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                  {language === 'vi' ? 'Milestone này hiện chưa có tệp đã nộp.' : 'No submitted file is attached to this milestone yet.'}
                </div>
              )}
            </div>
          </div>
        ) : null}
        {contractReviewModal.open ? (
          <ReviewPanel
            isOpen={contractReviewModal.open}
            onClose={() => setContractReviewModal({ open: false, contract: null, milestoneIndex: -1, recipientId: '', recipientName: '' })}
            onSubmitted={() => {
              setContractFeedback({
                type: 'success',
                message: language === 'vi' ? 'Đánh giá freelancer đã được lưu.' : 'Freelancer review saved successfully.',
              });
              setContractReviewModal({ open: false, contract: null, milestoneIndex: -1, recipientId: '', recipientName: '' });
            }}
            contractTitle={contractReviewModal.contract?.title?.[language] || contractReviewModal.contract?.title?.vi || contractReviewModal.contract?.title?.en || ''}
            milestoneTitle={
              contractReviewModal.contract?.milestones?.[contractReviewModal.milestoneIndex]?.title?.[language]
              || contractReviewModal.contract?.milestones?.[contractReviewModal.milestoneIndex]?.title?.vi
              || contractReviewModal.contract?.milestones?.[contractReviewModal.milestoneIndex]?.title?.en
              || ''
            }
            recipientName={contractReviewModal.recipientName}
            contractId={contractReviewModal.contract?.sourceJobId}
            milestoneId={`milestone-${contractReviewModal.milestoneIndex}`}
            recipientId={contractReviewModal.recipientId}
            language={language}
          />
        ) : null}
        </div>
      </div>,
    );
  }

  if (activePage === 'escrow') {
    return dashboardLayout(
      <>
        <PaymentCenter
          mode="client"
          balance={availableBalance}
          pendingBalance={pendingBalance}
          walletAmount={walletAmount}
          onWalletAmountChange={setWalletAmount}
          walletLoading={walletLoading}
          walletStatus={walletStatus}
          sepayPayment={sepayPayment}
          recentTransactions={recentTransactions}
          formatMoney={formatMoney}
          formatTransactionTime={formatTransactionTime}
          getTransactionLabel={getTransactionLabel}
          getTransactionTone={getTransactionTone}
          onTopUp={topUpBalance}
          onRelease={releasePayment}
          onWithdraw={() => setWithdrawModalOpen(true)}
        />
        {withdrawModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Withdraw</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">{language === 'vi' ? 'Tạo yêu cầu rút tiền' : 'Create withdrawal request'}</h3>
                </div>
                <button type="button" onClick={() => setWithdrawModalOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{language === 'vi' ? 'Ngân hàng' : 'Bank name'}</p>
                  <div className="relative">
                    <input
                      value={withdrawForm.bankName}
                      onFocus={() => setBankDropdownOpen(true)}
                      onChange={(event) => {
                        setWithdrawForm((current) => ({ ...current, bankName: event.target.value }));
                        setBankDropdownOpen(true);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                      placeholder={language === 'vi' ? 'Chọn hoặc nhập ngân hàng' : 'Select or type a bank'}
                    />
                    <button
                      type="button"
                      onClick={() => setBankDropdownOpen((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      ▾
                    </button>
                    {bankDropdownOpen ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[70] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                        {filteredBankOptions.length > 0 ? filteredBankOptions.map((bank) => {
                          const value = `${bank.shortName} - ${bank.name}`;
                          return (
                            <button
                              key={`${bank.code}-${bank.shortName}`}
                              type="button"
                              onClick={() => {
                                setWithdrawForm((current) => ({ ...current, bankName: value }));
                                setBankDropdownOpen(false);
                              }}
                              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <span className="font-semibold">{bank.shortName}</span>
                              <span className="text-slate-500"> - {bank.name}</span>
                            </button>
                          );
                        }) : (
                          <div className="px-3 py-3 text-sm text-slate-500">
                            {language === 'vi' ? 'Không tìm thấy ngân hàng.' : 'No banks found.'}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </label>
                {[
                  ['accountNumber', language === 'vi' ? 'Số tài khoản' : 'Account number'],
                  ['accountName', language === 'vi' ? 'Tên chủ tài khoản' : 'Account holder'],
                  ['amount', language === 'vi' ? 'Số tiền rút' : 'Withdrawal amount'],
                ].map(([field, label]) => (
                  <label key={field} className="block">
                    <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
                    <input
                      value={withdrawForm[field]}
                      onChange={(event) => setWithdrawForm((current) => ({ ...current, [field]: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                      placeholder={label}
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={() => setWithdrawModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                <button type="button" onClick={handleWithdrawRequest} disabled={walletLoading} className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">{language === 'vi' ? 'Gửi yêu cầu rút tiền' : 'Submit withdrawal request'}</button>
              </div>
            </div>
          </div>
        ) : null}
      </>,
    );

    return dashboardLayout(
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
          <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.22),transparent_28%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
            <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">{language === 'vi' ? 'Trung tâm thanh toán khách hàng' : 'Client payment center'}</p>
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
                        placeholder="Enter amount, for example 500000"
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
                  <p className="mt-2 text-2xl font-bold text-white">3,240,000 VND</p>
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
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">{language === 'vi' ? 'Trung tâm thanh toán khách hàng' : 'Client payment center'}</p>
                    <p className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white">{formatMoney(availableBalance)}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {language === 'vi' ? '+12,4% so với tháng trước' : '+12.4% vs last month'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Thanh toán an toàn' : 'Protected payments'}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{language === 'vi' ? 'Sẵn sàng vận hành' : 'Enterprise ready'}</p>
                    <p className="mt-1 text-xs text-white/55">{language === 'vi' ? 'Kiểm tra gian lận, xác minh đối tác, kiểm soát giải ngân' : 'Fraud checks, verified vendors, release controls'}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{language === 'vi' ? 'Số tiền thao tác' : 'Action amount'}</p>
                    <input
                      value={walletAmount}
                      onChange={(event) => setWalletAmount(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder={language === 'vi' ? 'Nhập số tiền, ví dụ 500' : 'Enter amount, for example 500'}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={topUpBalance}
                        disabled={walletLoading}
                        className="rounded-2xl bg-[#00B386] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {language === 'vi' ? 'Nạp tiền' : 'Top Up'}
                      </button>
                      <button
                        onClick={releasePayment}
                        disabled={walletLoading}
                        className="rounded-2xl border border-white/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1020] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {language === 'vi' ? 'Giải ngân' : 'Release Payment'}
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
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Giải ngân sắp tới' : 'Upcoming releases'}</p>
                  <p className="mt-2 text-2xl font-bold text-white">3,240,000 VND</p>
                      <p className="mt-1 text-xs text-white/55">{language === 'vi' ? 'Trên 4 hợp đồng đang hoạt động trong tuần này' : 'Across 4 active contracts this week'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Xác minh' : 'Verification'}</p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        {language === 'vi' ? 'Bảo vệ gian lận đang bật' : 'Fraud protection active'}
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
                  <p className="muted">{language === 'vi' ? 'Thao tác thông minh' : 'Smart actions'}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Công cụ thanh toán' : 'Payment tools'}</h2>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">{language === 'vi' ? 'Đề xuất' : 'Recommended'}</span>
                  <span className="px-3 py-1">{language === 'vi' ? 'Phím tắt' : 'Shortcuts'}</span>
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
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Chi tiêu theo tháng' : 'Monthly spend'}</p>
                <p className="mt-3 text-2xl font-bold text-ink">18,400,000 VND</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#00B386] to-emerald-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Hợp đồng đang hoạt động' : 'Active contracts'}</p>
                <p className="mt-3 text-2xl font-bold text-ink">7,900,000 VND</p>
                  <p className="mt-2 text-xs text-slate-500">{language === 'vi' ? 'Thanh toán đang phân bổ trên 8 đối tác' : 'Payments distributed across 8 suppliers'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Trạng thái tin cậy' : 'Trust status'}</p>
                  <p className="mt-3 text-2xl font-bold text-ink">{language === 'vi' ? 'Đã xác minh' : 'Verified'}</p>
                  <p className="mt-2 text-xs text-slate-500">{language === 'vi' ? 'Đã bật lớp bảo vệ thanh toán và kiểm tra đối tác' : 'Protected payment rails and vendor checks enabled'}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(11,16,32,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="muted">{language === 'vi' ? 'Phân tích' : 'Analytics'}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Dòng tiền và cơ cấu đối tác' : 'Cash flow & vendor mix'}</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                  {language === 'vi' ? 'Cập nhật 5 phút trước' : 'Updated 5m ago'}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFD] p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{language === 'vi' ? 'Chi tiêu theo tháng' : 'Monthly spending'}</p>
                      <p className="mt-1 text-xs text-slate-500">{language === 'vi' ? 'Biểu đồ giải ngân 6 tháng gần nhất' : 'Rolling 6-month payout curve'}</p>
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
                        <span className="text-[11px] text-slate-400">{(language === 'vi' ? ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])[index]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Phân bổ đối tác' : 'Vendor distribution'}</p>
                    <div className="mt-4 space-y-3">
                      {[
                        [language === 'vi' ? 'Thiết kế' : 'Design', '38%', 'bg-emerald-500'],
                        [language === 'vi' ? 'Kỹ thuật' : 'Engineering', '34%', 'bg-sky-500'],
                        [language === 'vi' ? 'Bảo mật' : 'Security', '18%', 'bg-violet-500'],
                        [language === 'vi' ? 'Khác' : 'Other', '10%', 'bg-slate-300'],
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
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Lớp tin cậy' : 'Trust layer'}</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> {language === 'vi' ? 'Thanh toán được bảo vệ' : 'Protected payments'}</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> {language === 'vi' ? 'Xác minh đối tác đang bật' : 'Vendor verification active'}</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> {language === 'vi' ? 'Đã bật kiểm soát phê duyệt' : 'Approval controls enabled'}</div>
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
              <p className="muted">{language === 'vi' ? 'Giao dịch' : 'Transactions'}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Lịch sử thanh toán' : 'Payment history'}</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {recentTransactions.length} {language === 'vi' ? 'mục' : 'items'}
            </div>
          </div>

          <div className="mt-6 flex min-h-[420px] flex-col rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 xl:min-h-0 xl:flex-1">
            <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500 shadow-sm">
              <span className="rounded-full bg-[#0B1020] px-3 py-1 text-white">{language === 'vi' ? 'Tất cả' : 'All'}</span>
              <span className="px-3 py-1">{language === 'vi' ? 'Tiền vào' : 'Incoming'}</span>
              <span className="px-3 py-1">{language === 'vi' ? 'Tiền ra' : 'Outgoing'}</span>
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
                        <span className="text-sm font-semibold text-ink">{getTransactionLabel(transaction.type, language)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                          {isPositive ? (language === 'vi' ? 'Tiền vào' : 'Incoming') : (language === 'vi' ? 'Tiền ra' : 'Outgoing')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {transaction.description || (language === 'vi' ? 'Đã ghi nhận giao dịch ví.' : 'Wallet transaction recorded.')}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{formatTransactionTime(transaction.createdAt, language)}</p>
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
                  <p className="mt-4 text-sm font-semibold text-ink">{language === 'vi' ? 'Chưa có hoạt động thanh toán' : 'No payment activity yet'}</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    {language === 'vi' ? 'Các lần nạp tiền, giải ngân milestone và thanh toán cho đối tác sẽ hiển thị tại đây khi bắt đầu phát sinh giao dịch.' : 'Your top-ups, milestone releases, and vendor payouts will appear here as soon as activity starts.'}
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
      <AppErrorBoundary>
        <SettingsPanel user={user} onUserChange={setUser} initialSection="bank" mode="bank" />
      </AppErrorBoundary>,
    );
  }

  if (activePage === 'profile') {
    return <Navigate to={`/client-profile/${user?.id || user?._id || 'me'}`} replace />;
  }

  if (activePage === 'disputes') {
    return dashboardLayout(
      <SectionCard className="p-6">
        <DisputeCenter role="client" contracts={contractList} />
      </SectionCard>,
    );
  }

  if (activePage === 'settings') {
    return dashboardLayout(
      <AppErrorBoundary>
        <SettingsPanel user={user} onUserChange={setUser} initialSection={settingsSection} />
      </AppErrorBoundary>,
    );
  }

  return dashboardLayout(
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{language === 'vi' ? 'Trung tâm điều hành khách hàng' : 'Client Command Center'}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{language === 'vi' ? 'Quản lý tuyển dụng, phê duyệt và thanh toán' : 'Manage hiring, approvals, and payments'}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">{language === 'vi' ? 'Xem lại công việc được gửi đến, phê duyệt milestone, quản lý số dư khả dụng và giữ mọi hợp đồng trong tầm kiểm soát từ một không gian khách hàng.' : 'Review incoming work, approve milestones, manage available balance, and keep every contract under control from one client workspace.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
               <button onClick={() => navigate('/client-jobs/new')} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">{language === 'vi' ? 'Thêm công việc' : 'Add Job'}</button>
               <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">{language === 'vi' ? 'Xem chào giá' : 'Review Proposals'}</button>
              <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">{language === 'vi' ? 'Mở thanh toán' : 'Open Payments'}</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{language === 'vi' ? 'Phê duyệt đang chờ' : 'Pending approvals'}</p><p className="mt-2 text-3xl font-bold text-ink">3</p><p className="mt-2 text-sm text-slate-500">{language === 'vi' ? 'Các milestone đang chờ bạn xem xét trong tuần này.' : 'Milestones waiting for your review this week.'}</p></div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{language === 'vi' ? 'Số dư khả dụng' : 'Available balance'}</p><p className="mt-2 text-3xl font-bold text-ink">{formatMoney(availableBalance)}</p><p className="mt-2 text-sm text-slate-500">{language === 'vi' ? 'Dùng số dư chung này cho các lần nạp tiền và giải ngân milestone.' : 'Use this shared balance for top-ups and milestone releases.'}</p><button onClick={() => setActivePage('escrow')} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">{language === 'vi' ? 'Mở thanh toán' : 'Open payments'}</button></div>
            </div>
          </div>
        </div>
      </SectionCard>
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { label: language === 'vi' ? 'Công việc đã đăng' : 'Posted jobs', value: `${postedJobsCount}`, hint: language === 'vi' ? 'Tổng số công việc đã tạo trong hệ thống' : 'Total jobs created in the system', icon: BriefcaseBusiness, accent: 'bg-pine/10 text-pine' },
          { label: language === 'vi' ? 'Hợp đồng hoạt động' : 'Active contracts', value: `${activeContractsCount}`, hint: language === 'vi' ? 'Số hợp đồng đang được thực hiện' : 'Contracts currently in progress', icon: ClipboardCheck, accent: 'bg-coral/10 text-coral' },
          { label: language === 'vi' ? 'Số dư khả dụng' : 'Available balance', value: formatMoney(availableBalance), hint: language === 'vi' ? 'Số dư dùng chung cho các thanh toán trên nền tảng' : 'Shared balance used for platform payments', icon: CircleDollarSign, accent: 'bg-gold/10 text-gold' },
        ].map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <SectionCard className="p-6">
        <div><p className="muted">{language === 'vi' ? 'Hoạt động khách hàng' : 'Client activity'}</p><h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Tổng quan tuyển dụng và phê duyệt' : 'Hiring and approval overview'}</h2></div>
        <div className="mt-6 space-y-4">
          {clientActivities.map((activity) => <div key={activity.title.en} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div><div className="flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">{activity.title[language] || activity.title.en}</h3><span className="text-sm text-slate-400">{activity.time[language] || activity.time.en}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{activity.description[language] || activity.description.en}</p></div></div>)}
        </div>
      </SectionCard>
    </div>,
  );
}

export default ClientDashboard;





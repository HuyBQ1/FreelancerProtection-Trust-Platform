import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, ChevronRight, CircleCheckBig, CircleDollarSign, Clock3, Download, Eye, FileCheck2, FileUp, HandCoins, Hourglass, Search, Shield, Sparkles, TrendingUp, Upload, UserRound, WalletCards, X, XCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import AppErrorBoundary from '../components/AppErrorBoundary';
import PaymentCenter from '../components/PaymentCenter';
import DisputeCenter from '../features/disputes/DisputeCenter';
import { contracts, sidebarItems } from '../data/appData';
import { createContractFromAcceptedJob, normalizeContractForView, sortContractsByWorkState } from '../utils/contractTransforms';
import { persistLanguage } from '../utils/language';
import { formatMoney, parseMoneyAmount } from '../utils/money';
import { readStoredUser, persistStoredUser } from '../utils/storedUser';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';
const VIETQR_BANKS_API = 'https://api.vietqr.io/v2/banks';
const FALLBACK_VN_BANKS = [
  { code: 'ABB', shortName: 'ABBANK', name: 'Ngân hàng TMCP An Bình' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
  { code: 'BAB', shortName: 'BacABank', name: 'Ngân hàng TMCP Bắc Á' },
  { code: 'BVB', shortName: 'BaoVietBank', name: 'Ngân hàng TMCP Bảo Việt' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CAKE', shortName: 'CAKE', name: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank' },
  { code: 'CBB', shortName: 'CBBank', name: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam' },
  { code: 'CIMB', shortName: 'CIMB', name: 'Ngân hàng TNHH MTV CIMB Việt Nam' },
  { code: 'CITIBANK', shortName: 'Citibank', name: 'Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội' },
  { code: 'COOPBANK', shortName: 'COOPBANK', name: 'Ngân hàng Hợp tác xã Việt Nam' },
  { code: 'DBS', shortName: 'DBSBank', name: 'DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh' },
  { code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { code: 'GPB', shortName: 'GPBank', name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh' },
  { code: 'HLBVN', shortName: 'HongLeong', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam' },
  { code: 'HSBC', shortName: 'HSBC', name: 'Ngân hàng TNHH MTV HSBC (Việt Nam)' },
  { code: 'IBK - HCM', shortName: 'IBKHCM', name: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh' },
  { code: 'IBK - HN', shortName: 'IBKHN', name: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội' },
  { code: 'IVB', shortName: 'IndovinaBank', name: 'Ngân hàng TNHH Indovina' },
  { code: 'KBank', shortName: 'KBank', name: 'Ngân hàng Đại chúng TNHH Kasikornbank' },
  { code: 'KEBHANAHCM', shortName: 'KEBHanaHCM', name: 'Ngân hàng KEB Hana - Chi nhánh Thành phố Hồ Chí Minh' },
  { code: 'KEBHANAHN', shortName: 'KEBHANAHN', name: 'Ngân hàng KEB Hana - Chi nhánh Hà Nội' },
  { code: 'KLB', shortName: 'KienLongBank', name: 'Ngân hàng TMCP Kiên Long' },
  { code: 'KBHCM', shortName: 'KookminHCM', name: 'Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh' },
  { code: 'KBHN', shortName: 'KookminHN', name: 'Ngân hàng Kookmin - Chi nhánh Hà Nội' },
  { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { code: 'MAFC', shortName: 'MAFC', name: 'Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam)' },
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội' },
  { code: 'MBV', shortName: 'MBV', name: 'Ngân hàng TNHH MTV Việt Nam Hiện Đại' },
  { code: 'momo', shortName: 'MoMo', name: 'CTCP Dịch Vụ Di Động Trực Tuyến' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { code: 'NAB', shortName: 'NamABank', name: 'Ngân hàng TMCP Nam Á' },
  { code: 'NCB', shortName: 'NCB', name: 'Ngân hàng TMCP Quốc Dân' },
  { code: 'NHB HN', shortName: 'Nonghyup', name: 'Ngân hàng Nonghyup - Chi nhánh Hà Nội' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { code: 'PGB', shortName: 'PGBank', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển' },
  { code: 'PBVN', shortName: 'PublicBank', name: 'Ngân hàng TNHH MTV Public Việt Nam' },
  { code: 'PVCB', shortName: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  { code: 'PVDB', shortName: 'PVcomBank Pay', name: 'Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'SGICB', shortName: 'SaigonBank', name: 'Ngân hàng TMCP Sài Gòn Công Thương' },
  { code: 'SCB', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  { code: 'SEAB', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
  { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { code: 'SHBVN', shortName: 'ShinhanBank', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam' },
  { code: 'SCVN', shortName: 'StandardChartered', name: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'TIMO', shortName: 'Timo', name: 'Ngân hàng số Timo by Ban Viet Bank' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'Ubank', shortName: 'Ubank', name: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank' },
  { code: 'UOB', shortName: 'UnitedOverseas', name: 'Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh' },
  { code: 'VBSP', shortName: 'VBSP', name: 'Ngân hàng Chính sách Xã hội' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { code: 'VAB', shortName: 'VietABank', name: 'Ngân hàng TMCP Việt Á' },
  { code: 'VIETBANK', shortName: 'VietBank', name: 'Ngân hàng TMCP Việt Nam Thương Tín' },
  { code: 'VCCB', shortName: 'VietCapitalBank', name: 'Ngân hàng TMCP Bản Việt' },
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'VTLMONEY', shortName: 'ViettelMoney', name: 'Tổng Công ty Dịch vụ số Viettel' },
  { code: 'Vikki', shortName: 'Vikki', name: 'Ngân hàng TNHH MTV Số Vikki' },
  { code: 'VNPTMONEY', shortName: 'VNPTMoney', name: 'VNPT Money' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'VRB', shortName: 'VRB', name: 'Ngân hàng Liên doanh Việt - Nga' },
  { code: 'WVN', shortName: 'Woori', name: 'Ngân hàng TNHH MTV Woori Việt Nam' },
];
const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
const filters = ['All', 'Design', 'Development', 'Security', 'Legal'];
const experienceFilterOptions = ['Entry', 'Intermediate', 'Senior', 'Expert'];
const engagementFilterOptions = ['Fixed price', 'Hourly', 'Retainer'];
const locationFilterOptions = ['Remote', 'Hybrid', 'On-site'];
const skillFilterOptions = [
  'React',
  'Vite',
  'Tailwind CSS',
  'JavaScript',
  'Node.js',
  'Express',
  'MongoDB',
  'Mongoose',
  'FastAPI',
  'Socket.IO',
  'UI/UX Design',
  'Dashboard',
  'Payment',
  'KYC',
  'API Integration',
  'Responsive UI',
];

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

function getTransactionLabel(type) {
  if (type === 'deposit') return 'Deposit';
  if (type === 'release') return 'Release payment';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'refund') return 'Refund';
  if (type === 'platform_fee') return 'Platform fee';
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

  if (type === 'withdrawal' || type === 'platform_fee') {
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

function localizeMilestoneStatus(status, language) {
  if (language !== 'vi') return status;
  if (status === 'Approved') return 'Đã duyệt';
  if (status === 'Completed') return 'Chờ duyệt';
  if (status === 'In Progress') return 'Đang thực hiện';
  if (status === 'Pending') return 'Chờ xử lý';
  if (status === 'Active') return 'Đang hoạt động';
  return status;
}

function localizeContractStatus(status, language) {
  if (language !== 'vi') return status;
  if (status === 'Declined') return 'Bị từ chối';
  if (status === 'Completed') return 'Thành công';
  if (status === 'Active') return 'Đang hoạt động';
  return status;
}

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
      trustCenter: 'Trung tâm tin cậy',
      workspaceDesc: 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.',
      balanceProtected: 'Số dư khả dụng',
      balanceDesc: 'Số dư dùng chung cho thanh toán và rút tiền trên nền tảng.',
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
    trustCenter: 'Trust Center',
    workspaceDesc: 'Manage jobs, contracts, payments, and disputes in one place.',
    balanceProtected: 'Available balance',
    balanceDesc: 'Shared balance used for payouts and platform payments.',
  };
}

function getTitles(language) {
  if (language === 'vi') {
    return {
      dashboard: 'Bảng điều khiển freelancer',
      marketplace: 'Thị trường công việc',
      contracts: 'Hợp đồng',
      chat: 'Trò chuyện',
      bank: 'Tài khoản ngân hàng',
      escrow: 'Thanh toán',
      disputes: 'Tranh chấp',
      settings: 'Cài đặt',
    };
  }

  return {
    dashboard: 'Dashboard',
    marketplace: 'Marketplace',
    contracts: 'Contracts',
    chat: 'Chat',
    bank: 'Bank Account',
    escrow: 'Payments',
    disputes: 'Disputes',
    settings: 'Settings',
  };
}

function getCleanFreelancerLabels(language) {
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
      trustCenter: 'Trung tâm tin cậy',
      workspaceDesc: 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.',
      balanceProtected: 'Số dư khả dụng',
      balanceDesc: 'Số dư dùng chung cho thanh toán và rút tiền trên nền tảng.',
    };
  }

  return getLabels(language);
}

function getCleanFreelancerTitles(language) {
  if (language === 'vi') {
    return {
      dashboard: 'Bảng điều khiển freelancer',
      marketplace: 'Thị trường công việc',
      contracts: 'Hợp đồng',
      chat: 'Trò chuyện',
      bank: 'Tài khoản ngân hàng',
      escrow: 'Thanh toán',
      disputes: 'Tranh chấp',
      settings: 'Cài đặt',
    };
  }

  return getTitles(language);
}

function FreelancerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingInitialContractId, setPendingInitialContractId] = useState(`${location.state?.initialContractId || ''}`);
  const [user, setUser] = useState(readStoredUser);
  const [activePage, setActivePage] = useState(location.state?.initialPage || 'dashboard');
  const [settingsSection, setSettingsSection] = useState('profile');
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [fixedBudgetEnabled, setFixedBudgetEnabled] = useState(false);
  const [hourlyBudgetEnabled, setHourlyBudgetEnabled] = useState(false);
  const [selectedSkillFilters, setSelectedSkillFilters] = useState([]);
  const [selectedCodeCategories, setSelectedCodeCategories] = useState([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState([]);
  const [selectedEngagementTypes, setSelectedEngagementTypes] = useState([]);
  const [selectedLocationTypes, setSelectedLocationTypes] = useState([]);
  const [jobStateFilter, setJobStateFilter] = useState('all-open');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedContractId, setSelectedContractId] = useState(`${location.state?.initialContractId || contracts[0]?.id || ''}`);
  const [notificationThreadId, setNotificationThreadId] = useState(location.state?.initialThreadId || '');
  const [availableBalance, setAvailableBalance] = useState(() => Number(user?.balance || 0));
  const [pendingBalance, setPendingBalance] = useState(0);
  const [jobList, setJobList] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [contractFeedback, setContractFeedback] = useState({ type: '', message: '' });
  const [walletStatus, setWalletStatus] = useState({ type: '', message: '' });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [sepayPayment, setSepayPayment] = useState(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ bankName: '', accountNumber: '', accountName: '', amount: '' });
  const [bankOptions, setBankOptions] = useState(FALLBACK_VN_BANKS);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [submitModal, setSubmitModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [reviewModal, setReviewModal] = useState({ open: false, contract: null, milestone: null, milestoneIndex: -1 });
  const [reviewZoom, setReviewZoom] = useState(1);
  const [reviewPan, setReviewPan] = useState({ x: 0, y: 0 });
  const [submitForm, setSubmitForm] = useState({ note: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [contractSignature, setContractSignature] = useState('');
  const [contractSignatureImage, setContractSignatureImage] = useState('');
  const [signatureModal, setSignatureModal] = useState({ open: false, contract: null });
  const [signingContract, setSigningContract] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const language = user?.settings?.language || 'en';
  const labels = getCleanFreelancerLabels(language);
  const titles = getCleanFreelancerTitles(language);

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
        const nextBalance = location.state.paymentSummary.balance;
        setAvailableBalance(nextBalance);
        setUser((currentUser) => {
          const nextUser = { ...currentUser, balance: nextBalance };
          localStorage.setItem('fptp_user', JSON.stringify(nextUser));
          return nextUser;
        });
      }

      if (location.state.paymentSummary.pendingBalance !== undefined) {
        setPendingBalance(location.state.paymentSummary.pendingBalance);
      }

      if (Array.isArray(location.state.paymentSummary.recentTransactions)) {
        setRecentTransactions(location.state.paymentSummary.recentTransactions);
      }
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
            localStorage.setItem('fptp_user', JSON.stringify(nextUser));
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

  React.useEffect(() => {
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

  const fetchPublicJobs = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPublicJobs();
  }, [fetchPublicJobs]);

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

  useEffect(() => {
    const refreshFreelancerData = () => {
      if (document.hidden) return;
      fetchPublicJobs();
      fetchAssignedJobs();
      fetchEscrowSummary();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshFreelancerData();
    };

    const handleRealtimeNotification = (event) => {
      const page = event.detail?.actionPage;
      if (!page || ['contracts', 'marketplace', 'escrow', 'disputes'].includes(page)) {
        refreshFreelancerData();
      }
    };

    const intervalId = window.setInterval(refreshFreelancerData, 5000);
    window.addEventListener('focus', refreshFreelancerData);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('fptp:notification', handleRealtimeNotification);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshFreelancerData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('fptp:notification', handleRealtimeNotification);
    };
  }, [fetchAssignedJobs, fetchEscrowSummary, fetchPublicJobs]);

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
  const codeCategoryOptions = filters.filter((filter) => filter !== 'All');

  const toggleArrayValue = (values, value) => (
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
  );

  const parseDurationDays = (value) => {
    const rawValue = `${value || ''}`.toLowerCase();
    const numbers = rawValue.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (numbers.length === 0) return 0;

    const maxValue = Math.max(...numbers);
    if (rawValue.includes('month')) return maxValue * 30;
    if (rawValue.includes('week')) return maxValue * 7;
    if (rawValue.includes('hour')) return Math.ceil(maxValue / 24);
    return maxValue;
  };

  const getJobDurationDays = (job) => parseDurationDays(job.timeline || job.delivery || job.duration || job.deadline || '');
  const getJobText = (job) => [
    job.title,
    job.client,
    job.clientName,
    job.description,
    job.requirements,
    job.location,
    job.locationType,
    job.engagementType,
    job.timeline,
    job.scopeSummary,
    ...(job.skills || []),
  ].join(' ').toLowerCase();

  const filteredJobs = marketplaceJobs
    .filter((job) => {
      const keyword = query.trim().toLowerCase();
      const searchableText = getJobText(job);
      const budgetAmount = parseMoneyAmount(job.budget);
      const minAmount = fixedBudgetEnabled && minBudget !== '' ? Number(minBudget) : null;
      const maxAmount = fixedBudgetEnabled && maxBudget !== '' ? Number(maxBudget) : null;
      const maxDurationDays = durationDays === '' ? null : Number(durationDays);
      const jobDurationDays = getJobDurationDays(job);
      const normalizedLocation = `${job.locationType || job.location || ''}`.toLowerCase();
      const normalizedEngagement = `${job.engagementType || ''}`.toLowerCase();
      const normalizedExperience = `${job.experienceLevel || ''}`.toLowerCase();
      const normalizedStatus = `${job.status || ''}`.toLowerCase();

      const matchesSkills = selectedSkillFilters.length === 0 || selectedSkillFilters.some((skill) => searchableText.includes(skill.toLowerCase()));
      const matchesCodeCategories = selectedCodeCategories.length === 0 || selectedCodeCategories.includes(job.category);
      const matchesExperience = selectedExperienceLevels.length === 0 || selectedExperienceLevels.some((level) => normalizedExperience === level.toLowerCase());
      const matchesEngagement = selectedEngagementTypes.length === 0 || selectedEngagementTypes.some((type) => normalizedEngagement === type.toLowerCase());
      const matchesLocation = selectedLocationTypes.length === 0 || selectedLocationTypes.some((type) => normalizedLocation === type.toLowerCase());
      const matchesJobState = jobStateFilter === 'all' || normalizedStatus === 'open' || normalizedStatus === '';

      return (
        (!keyword || searchableText.includes(keyword)) &&
        (selectedFilter === 'All' || job.category === selectedFilter) &&
        (!hourlyBudgetEnabled || normalizedEngagement.includes('hour')) &&
        (minAmount === null || budgetAmount >= minAmount) &&
        (maxAmount === null || budgetAmount <= maxAmount) &&
        (maxDurationDays === null || (jobDurationDays > 0 && jobDurationDays <= maxDurationDays)) &&
        matchesSkills &&
        matchesCodeCategories &&
        matchesExperience &&
        matchesEngagement &&
        matchesLocation &&
        matchesJobState
      );
    })
    .sort((a, b) => {
      if (sortBy === 'budget-high') return parseMoneyAmount(b.budget) - parseMoneyAmount(a.budget);
      if (sortBy === 'budget-low') return parseMoneyAmount(a.budget) - parseMoneyAmount(b.budget);
      if (sortBy === 'duration-short') return getJobDurationDays(a) - getJobDurationDays(b);
      return 0;
    });
  const contractList = sortContractsByWorkState([
    ...acceptedJobs.map(createContractFromAcceptedJob),
  ].map((contract, index) => normalizeContractForView(contract, index)));
  const selectedContract = contractList.find((item) => `${item.id}` === `${selectedContractId}`) ?? contractList[0];
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
    persistLanguage(language);
    const nextUser = {
      ...user,
      settings: {
        ...user?.settings,
        language,
      },
    };

    setUser(nextUser);
    persistStoredUser(nextUser);
  };

  const handleSidebarNavigate = (page) => {
    if (page === 'profile') {
      navigate(`/freelancer-profile/${user?.id || user?._id || 'me'}`, {
        state: {
          fromSelfProfile: true,
          profileSeed: {
            id: user?.id || user?._id || '',
            fullName: user?.fullName || user?.email || '',
            email: user?.email || '',
            headline: user?.settings?.freelancerProfile?.headline || '',
            totalReviews: user?.ratingCount || 0,
            rating: user?.rating || '0.0',
          },
        },
      });
      return;
    }

    setActivePage(page);
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
    if (contract?.status === 'Declined') {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Hợp đồng đã bị từ chối nên không thể nộp sản phẩm.' : 'This contract was declined, so submission is disabled.' });
      return;
    }
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

      setAcceptedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${contract.sourceJobId}`
        ? { ...job, ...(data.job || {}), freelancerProposalStatus: 'declined' }
        : job)));
      setPendingBalance((current) => Math.max(0, current - (data.refundedAmount || 0)));
      setContractFeedback({ type: 'success', message: 'Contract cancelled. The freelancer view now marks it as declined.' });
    } catch (error) {
      console.error('Failed to cancel job:', error);
      setContractFeedback({ type: 'error', message: 'Something went wrong while cancelling this job.' });
    }
  };

  const closeSignatureModal = () => {
    setSignatureModal({ open: false, contract: null });
    setContractSignature('');
    setContractSignatureImage('');
    signatureDrawingRef.current = false;
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
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startSignatureDraw = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getSignaturePoint(event);
    signatureDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const drawSignature = (event) => {
    if (!signatureDrawingRef.current) return;
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
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập họ tên để ký hợp đồng.' : 'Please enter your full name to sign.' });
      return;
    }

    if (!contractSignatureImage) {
      setContractFeedback({ type: 'error', message: language === 'vi' ? 'Vui lòng upload ảnh chữ ký trước khi xác nhận.' : 'Please upload a signature image before confirming.' });
      return;
    }

    const token = localStorage.getItem('fptp_token');
    if (!token) {
      setContractFeedback({ type: 'error', message: 'Please log in again before signing.' });
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

      setAcceptedJobs((currentJobs) => currentJobs.map((job) => (`${job.id}` === `${data.job.id}` ? data.job : job)));
      closeSignatureModal();
      setContractFeedback({
        type: 'success',
        message: data.job?.onlineContract?.status === 'signed'
          ? (language === 'vi' ? 'Hai bên đã ký hợp đồng. Bạn có thể bắt đầu làm việc.' : 'Both parties signed the contract. You can start working.')
          : (language === 'vi' ? 'Bạn đã ký hợp đồng. Đang chờ client ký.' : 'Your signature was submitted. Waiting for the client signature.'),
      });
      await fetchAssignedJobs();
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

  const handleWalletAction = async () => {
    const amount = Number(withdrawForm.amount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập số tiền hợp lệ.' : 'Please enter a valid amount.' });
      return;
    }
    if (!withdrawForm.bankName.trim() || !withdrawForm.accountNumber.trim() || !withdrawForm.accountName.trim()) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập đầy đủ ngân hàng, số tài khoản, tên chủ tài khoản.' : 'Please enter bank name, account number, and account holder.' });
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
        body: JSON.stringify({
          amount,
          bankName: withdrawForm.bankName.trim(),
          accountNumber: withdrawForm.accountNumber.trim(),
          accountName: withdrawForm.accountName.trim(),
        }),
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
      setWithdrawForm({ bankName: '', accountNumber: '', accountName: '', amount: '' });
      setWalletAmount('');
      setWithdrawModalOpen(false);
      setWalletStatus({
        type: 'success',
        message: language === 'vi'
          ? 'Yêu cầu rút tiền đã được tạo và đang chờ admin duyệt.'
          : 'Withdrawal request created and pending admin approval.',
      });

      const nextUser = {
        ...user,
        balance: nextBalance,
      };
      setUser(nextUser);
      persistStoredUser(nextUser);
    } catch (error) {
      setWalletStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not withdraw funds.',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const topUpBalance = async () => {
    const amount = Number(walletAmount);
    setWalletStatus({ type: '', message: '' });

    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập số tiền hợp lệ.' : 'Please enter a valid amount.' });
      return;
    }

    const token = localStorage.getItem('fptp_token');
    if (!token) {
      setWalletStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng đăng nhập lại trước khi nạp tiền.' : 'Please log in again before topping up.' });
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
        body: JSON.stringify({ amount }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not top up balance.');
      }

      if (data.transaction) {
        setRecentTransactions((current) => [data.transaction, ...current].slice(0, 8));
      }
      setSepayPayment(data.payment || null);
      setTopUpModalOpen(Boolean(data.payment));
      setWalletAmount('');
      const transferContent = data.payment?.transferContent || data.payment?.paymentCode || '';
      const bankLabel = data.payment?.bankName || data.payment?.bankCode || 'SePay';
      const accountNo = data.payment?.accountNumber || '';
      const amountLabel = data.payment?.amountLabel || formatMoney(amount);
      setWalletStatus({
        type: 'success',
        message: language === 'vi'
          ? `SePay đang chờ: Chuyển ${amountLabel} tới ${bankLabel} ${accountNo ? `(${accountNo})` : ''}, nội dung "${transferContent}".`
          : `SePay pending: Transfer ${amountLabel} to ${bankLabel} ${accountNo ? `(${accountNo})` : ''}, content "${transferContent}".`,
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

  const activeContracts = contractList;
  const completedContracts = contractList.filter((contract) => contract.status === 'Completed');
  const totalContractValue = contractList.reduce((total, contract) => total + parseMoneyAmount(contract.budget), 0);
  const earnedValue = contractList.reduce((total, contract) => total + parseMoneyAmount(contract.earned), 0);
  const completedMilestoneCount = contractList.reduce((total, contract) => total + (contract.completedMilestones || 0), 0);
  const totalMilestoneCount = contractList.reduce((total, contract) => total + (contract.totalMilestones || 0), 0);
  const declinedContractCount = contractList.filter((contract) => contract.status === 'Declined').length;
  const nextMilestones = contractList
    .filter((contract) => contract.status !== 'Declined')
    .flatMap((contract) => contract.milestones
      .filter((milestone) => !['Approved', 'Completed'].includes(milestone.status))
      .map((milestone) => ({ ...milestone, contractTitle: contract.title?.[language] || contract.title?.vi || contract.title?.en, contractId: contract.id })))
    .slice(0, 4);
  const recommendedJobs = jobList.filter((job) => `${job.status || 'open'}`.toLowerCase() === 'open').slice(0, 3);
  const transactionBars = recentTransactions.slice(0, 6).reverse();
  const maxTransactionAmount = Math.max(1, ...transactionBars.map((transaction) => transaction.amount || 0));
  const filteredBankOptions = bankOptions
    .filter((bank) => {
      const keyword = withdrawForm.bankName.toLowerCase().trim();
      if (!keyword) return true;
      return `${bank.shortName} ${bank.name} ${bank.code}`.toLowerCase().includes(keyword);
    });

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

  const withdrawRequestModal = withdrawModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              {language === 'vi' ? 'Rút tiền' : 'Withdrawal'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {language === 'vi' ? 'Tạo yêu cầu rút tiền' : 'Create withdrawal request'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'vi' ? 'Admin sẽ duyệt yêu cầu trước khi chuyển khoản thành công.' : 'An admin must approve this request before the transfer is completed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(false)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
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
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(false)}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleWalletAction}
            disabled={walletLoading}
            className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {language === 'vi' ? 'Gửi yêu cầu rút tiền' : 'Submit withdrawal request'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const dashboardLayout = (content) => (
    <div className={`${activePage === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-100/80`}>
      <div className={`mx-auto flex w-full gap-4 px-3 py-4 sm:gap-5 sm:px-5 xl:gap-6 xl:px-6 ${activePage === 'chat' ? 'h-full overflow-hidden' : ''}`}>
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={handleSidebarNavigate} labels={labels} balanceValue={formatMoney(availableBalance)} />
        <div className={`min-w-0 flex-1 ${activePage === 'chat' ? 'flex min-h-0 flex-col space-y-4 overflow-hidden' : 'space-y-6'}`}>
          <Topbar
            title={titles[activePage]}
            subtitle={language === 'vi' ? 'Nền tảng Bảo vệ & Tin cậy cho Freelancer' : 'Freelancer Protection & Trust Platform'}
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
            onNotificationOpen={handleNotificationOpen}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'freelancer', logout: language === 'vi' ? 'Đăng xuất' : 'Logout' }}
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
      {withdrawRequestModal}
    </div>
  );

  if (activePage === 'marketplace') {
    const filterLabel = (vi, en) => (language === 'vi' ? vi : en);
    const filterSectionClass = 'border-b border-slate-200 pb-4';
    const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-pine';
    const checkboxClass = 'h-3.5 w-3.5 rounded border-slate-300 text-pine focus:ring-pine';

    return dashboardLayout(
      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="muted">{filterLabel('Th\u1ecb tr\u01b0\u1eddng c\u00f4ng vi\u1ec7c', 'Marketplace')}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{filterLabel('T\u00ecm c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p', 'Find the right jobs')}</h2>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:min-w-[320px]">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={filterLabel('T\u00ecm c\u00f4ng vi\u1ec7c ho\u1eb7c kh\u00e1ch h\u00e0ng', 'Search jobs or clients')} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
          </div>
        </SectionCard>

        <div className="grid gap-6 2xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="text-sm font-bold text-ink">Bộ lọc</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedFilter('All');
                  setFixedBudgetEnabled(false);
                  setHourlyBudgetEnabled(false);
                  setMinBudget('');
                  setMaxBudget('');
                  setDurationDays('');
                  setSelectedSkillFilters([]);
                  setSelectedCodeCategories([]);
                  setSelectedExperienceLevels([]);
                  setSelectedEngagementTypes([]);
                  setSelectedLocationTypes([]);
                  setJobStateFilter('all-open');
                  setSortBy('newest');
                }}
                className="text-xs font-medium text-coral hover:underline"
              >
                Xóa
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Ngân sách</p>
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={fixedBudgetEnabled} onChange={(event) => setFixedBudgetEnabled(event.target.checked)} className={checkboxClass} />
                  Dự án giá cố định
                </label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input type="number" min="0" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} placeholder="min" disabled={!fixedBudgetEnabled} className={inputClass} />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="max" disabled={!fixedBudgetEnabled} className={inputClass} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={hourlyBudgetEnabled} onChange={(event) => setHourlyBudgetEnabled(event.target.checked)} className={checkboxClass} />
                  Dự án theo giờ
                </label>
                <select value={durationDays} onChange={(event) => setDurationDays(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-pine">
                  <option value="">Tất cả thời lượng</option>
                  <option value="7">Dưới 1 tuần</option>
                  <option value="30">Dưới 1 tháng</option>
                  <option value="90">Dưới 3 tháng</option>
                  <option value="180">Dưới 6 tháng</option>
                </select>
              </div>

              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Kỹ năng</p>
                {skillFilterOptions.map((skill) => (
                  <label key={skill} className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={selectedSkillFilters.includes(skill)} onChange={() => setSelectedSkillFilters((current) => toggleArrayValue(current, skill))} className={checkboxClass} />
                    {skill}
                  </label>
                ))}
              </div>

              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Danh mục</p>
                {codeCategoryOptions.map((item) => (
                  <label key={item} className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={selectedCodeCategories.includes(item)} onChange={() => setSelectedCodeCategories((current) => toggleArrayValue(current, item))} className={checkboxClass} />
                    {item}
                  </label>
                ))}
              </div>

              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Mức kinh nghiệm</p>
                {experienceFilterOptions.map((item) => (
                  <label key={item} className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={selectedExperienceLevels.includes(item)} onChange={() => setSelectedExperienceLevels((current) => toggleArrayValue(current, item))} className={checkboxClass} />
                    {item}
                  </label>
                ))}
              </div>

              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Hình thức hợp tác</p>
                {engagementFilterOptions.map((item) => (
                  <label key={item} className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={selectedEngagementTypes.includes(item)} onChange={() => setSelectedEngagementTypes((current) => toggleArrayValue(current, item))} className={checkboxClass} />
                    {item}
                  </label>
                ))}
              </div>

              <div className={filterSectionClass}>
                <p className="mb-3 text-xs font-bold text-slate-900">Địa điểm</p>
                {locationFilterOptions.map((item) => (
                  <label key={item} className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={selectedLocationTypes.includes(item)} onChange={() => setSelectedLocationTypes((current) => toggleArrayValue(current, item))} className={checkboxClass} />
                    {item}
                  </label>
                ))}
              </div>

              <div>
                <p className="mb-3 text-xs font-bold text-slate-900">Trạng thái công việc</p>
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                  <input type="radio" name="jobState" checked={jobStateFilter === 'all-open'} onChange={() => setJobStateFilter('all-open')} className="h-3.5 w-3.5 border-slate-300 text-pine focus:ring-pine" />
                  All open jobs
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="radio" name="jobState" checked={jobStateFilter === 'all'} onChange={() => setJobStateFilter('all')} className="h-3.5 w-3.5 border-slate-300 text-pine focus:ring-pine" />
                  All open and closed jobs
                </label>
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">{filterLabel(`${filteredJobs.length} c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p`, `${filteredJobs.length} matching jobs`)}</p>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button key={filter} onClick={() => setSelectedFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFilter === filter ? 'bg-pine text-white' : 'bg-slate-50 text-slate-600 hover:text-slate-900'}`}>
                    {filter}
                  </button>
                ))}
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-pine">
                  <option value="newest">Default</option>
                  <option value="budget-high">Highest budget</option>
                  <option value="budget-low">Lowest budget</option>
                  <option value="duration-short">Shortest duration</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id || job.title}
                  job={job}
                  labels={{ budget: language === 'vi' ? 'Ng\u00e2n s\u00e1ch' : 'Budget', client: language === 'vi' ? 'Kh\u00e1ch h\u00e0ng' : 'Client' }}
                  actionLabel={language === 'vi' ? 'Xem c\u00f4ng vi\u1ec7c' : 'View Job'}
                  onAction={() => navigate(`/freelancer-jobs/${job.id || job.title}`)}
                />
              ))}
            </div>
            {filteredJobs.length === 0 ? (
              <SectionCard className="p-6">
                <p className="muted">{language === 'vi' ? 'Kh\u00f4ng t\u00ecm th\u1ea5y c\u00f4ng vi\u1ec7c' : 'No jobs found'}</p>
                <h3 className="mt-2 text-xl font-bold text-ink">{language === 'vi' ? 'H\u00e3y th\u1eed b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a kh\u00e1c' : 'Try a different search or filter'}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {language === 'vi'
                    ? 'Ch\u00fang t\u00f4i ch\u01b0a t\u00ecm th\u1ea5y c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p trong danh s\u00e1ch hi\u1ec7n t\u1ea1i. H\u00e3y x\u00f3a b\u1ed9 l\u1ecdc ho\u1eb7c th\u1eed t\u1eeb kh\u00f3a kh\u00e1c.'
                    : 'We could not find a matching job in the current list. Clear the filters or try another keyword.'}
                </p>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>,
    );
  }

  if (activePage === 'contracts') {
    if (!selectedContract) {
      return dashboardLayout(
        <SectionCard className="p-8">
          <p className="muted">{language === 'vi' ? 'Hợp đồng' : 'Contracts'}</p>
          <h2 className="mt-2 text-xl font-bold text-ink">{language === 'vi' ? 'Chưa có hợp đồng nào' : 'No contracts available yet'}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            {language === 'vi'
              ? 'Các công việc đã nhận và hợp đồng đang hoạt động sẽ xuất hiện ở đây khi freelancer và khách hàng bắt đầu làm việc cùng nhau.'
              : 'Accepted jobs and active contracts will appear here once a client and freelancer start working together.'}
          </p>
        </SectionCard>,
      );
    }

    const progressWidth = `${selectedContract.progress}%`;
    const milestoneMeta = {
      Approved: { wrapper: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', icon: <HandCoins className="h-4 w-4" /> },
      Completed: { wrapper: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: <Clock3 className="h-4 w-4" /> },
      'In Progress': { wrapper: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: <Clock3 className="h-4 w-4" /> },
      Pending: { wrapper: 'bg-slate-100 text-slate-500', badge: 'bg-slate-100 text-slate-600', icon: <Hourglass className="h-4 w-4" /> },
    };

    const requiresSignature = selectedContract.onlineContract?.status === 'pending_signature'
      && !selectedContract.onlineContract?.freelancerSignature;

    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Hợp đồng' : 'Contracts'}</h2>
          <p className="mt-2 text-sm text-slate-500">{language === 'vi' ? `${activeContracts.length} hợp đồng` : `${activeContracts.length} contracts total`}</p>
        </div>
        {contractFeedback.message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${contractFeedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {contractFeedback.message}
          </div>
        ) : null}
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {activeContracts.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(`${contract.id}`)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${`${contract.id}` === `${selectedContract.id}` ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-ink">{contract.title?.[language] || contract.title?.vi || contract.title?.en}</p>
                    <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contract.status === 'Declined' ? 'bg-rose-100 text-rose-700' : contract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{localizeContractStatus(contract.status, language)}</span>
                </div>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <div className="space-y-5">
            {selectedContract.onlineContract?.status === 'signed' ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {language === 'vi'
                  ? `Hợp đồng online đã đủ chữ ký: client ${selectedContract.onlineContract.clientSignature || 'client'} và freelancer ${selectedContract.onlineContract.freelancerSignature || 'freelancer'}.`
                  : `Online contract signed by client ${selectedContract.onlineContract.clientSignature || 'client'} and freelancer ${selectedContract.onlineContract.freelancerSignature || 'freelancer'}.`}
              </div>
            ) : selectedContract.onlineContract ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                {language === 'vi'
                  ? `Hợp đồng đang chờ chữ ký: ${selectedContract.onlineContract.freelancerSignature ? 'còn client' : 'còn freelancer'} cần ký.`
                  : `Contract is waiting for signature: ${selectedContract.onlineContract.freelancerSignature ? 'client' : 'freelancer'} still needs to sign.`}
              </div>
            ) : null}
            <SectionCard className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-ink">{selectedContract.title?.[language] || selectedContract.title?.vi || selectedContract.title?.en}</h3>
                  <p className="mt-2 flex items-center gap-2 text-slate-500"><UserRound className="h-4 w-4" />{selectedContract.client}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedContract.onlineContract ? (
                    <button
                      type="button"
                      onClick={() => downloadOnlineContract(selectedContract)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />
                      {language === 'vi' ? 'Tải hợp đồng Word' : 'Download Word'}
                    </button>
                  ) : null}
                  {requiresSignature ? (
                    <button
                      type="button"
                      onClick={() => setSignatureModal({ open: true, contract: selectedContract })}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      {language === 'vi' ? 'Ký hợp đồng' : 'Sign Contract'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => cancelAcceptedJob(selectedContract)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <XCircle className="h-4 w-4" />
                    {language === 'vi' ? 'Hủy công việc' : 'Cancel Job'}
                  </button>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${selectedContract.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{localizeContractStatus(selectedContract.status, language)}</span>
                </div>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Tổng ngân sách' : 'Total budget'}</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.budget}</p></div>
                <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Đã nhận' : 'Earned'}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedContract.earned}</p></div>
                <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Ngày bắt đầu' : 'Start date'}</p><p className="mt-2 text-lg font-semibold text-ink">{selectedContract.startDate}</p></div>
                <div><p className="text-sm text-slate-500">{language === 'vi' ? 'Ngày kết thúc' : 'End date'}</p><p className="mt-2 text-lg font-semibold text-ink">{selectedContract.endDate}</p></div>
              </div>
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500"><span>{language === 'vi' ? 'Tiến độ' : 'Progress'}</span><span className="font-semibold text-slate-700">{selectedContract.progress}%</span></div>
                <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-indigo-600" style={{ width: progressWidth }} /></div>
                <p className="mt-2 text-sm text-slate-500">{language === 'vi' ? `${selectedContract.completedMilestones} / ${selectedContract.totalMilestones} milestone đã hoàn tất` : `${selectedContract.completedMilestones} of ${selectedContract.totalMilestones} milestones complete`}</p>
              </div>
            </SectionCard>
            <SectionCard className="p-6">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Shield className="h-4 w-4" /></div><h3 className="text-2xl font-bold text-ink">{language === 'vi' ? 'Các milestone' : 'Milestones'}</h3></div>
              {requiresSignature ? (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  {language === 'vi' ? 'Milestone đang bị khóa cho tới khi bạn ký hợp đồng online.' : 'Milestones are locked until you sign the online contract.'}
                </p>
              ) : null}
              <div className="mt-6 space-y-4">
                {selectedContract.milestones.map((milestone, milestoneIndex) => {
                  const meta = milestoneMeta[milestone.status] || milestoneMeta.Pending;
                  const isApprove = milestone.action === 'Approve';
                  const isDeclinedContract = selectedContract.status === 'Declined';
                  return (
                    <div key={milestone.title?.[language] || milestone.title?.vi || milestone.title?.en} className="flex flex-col gap-4 rounded-2xl border border-slate-200 px-4 py-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.wrapper}`}>{meta.icon}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3"><p className="truncate text-lg font-semibold text-ink">{milestone.title?.[language] || milestone.title?.vi || milestone.title?.en}</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>{localizeMilestoneStatus(milestone.status, language)}</span></div>
                          <p className="mt-1 text-sm text-slate-500">{language === 'vi' ? `Hạn ${milestone.dueDate}` : `Due ${milestone.dueDate}`}<span className="mx-2 text-slate-300">|</span><span className="font-semibold text-ink">{milestone.amount}</span></p>
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
                            {language === 'vi' ? (milestone.reviewAction === 'View Brief' ? 'Xem brief' : milestone.reviewAction === 'View Product' ? 'Xem sản phẩm' : milestone.reviewAction === 'View Draft' ? 'Xem bản nháp' : milestone.reviewAction === 'Review Product' ? 'Xem sản phẩm' : milestone.reviewAction) : milestone.reviewAction}
                          </button>
                        ) : null}
                        {milestone.action ? (
                          <button
                            onClick={() => {
                              if (isDeclinedContract) {
                                setContractFeedback({ type: 'error', message: language === 'vi' ? 'Hợp đồng đã bị từ chối nên không thể nộp sản phẩm.' : 'This contract was declined, so submission is disabled.' });
                                return;
                              }
                              if (requiresSignature) {
                                setContractFeedback({ type: 'error', message: language === 'vi' ? 'Bạn cần ký hợp đồng online trước khi nộp sản phẩm.' : 'Please sign the online contract before submitting work.' });
                                return;
                              }
                              if (!isApprove) {
                                openSubmitModal(selectedContract, milestone, milestoneIndex);
                              }
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isDeclinedContract || requiresSignature ? 'cursor-not-allowed bg-slate-200 text-slate-500' : isApprove ? 'cursor-default border border-emerald-500 text-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            disabled={isDeclinedContract}
                          >
                            {isApprove ? <Eye className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                            {language === 'vi' ? (milestone.action === 'Submit Work' ? 'Nộp sản phẩm' : milestone.action === 'Approve' ? 'Chờ duyệt' : milestone.action) : milestone.action}
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
        {signatureModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-bold text-amber-700">{language === 'vi' ? 'Hợp đồng online' : 'Online contract'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{signatureModal.contract?.onlineContract?.title || signatureModal.contract?.title?.vi || signatureModal.contract?.title?.en}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === 'vi' ? 'Đọc hợp đồng và ký bằng chuột trong khung chữ ký bên dưới.' : 'Read the contract and sign with your mouse in the signature box below.'}
                  </p>
                </div>
                <button onClick={closeSignatureModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_420px]">
                <div className="min-h-0 overflow-y-auto bg-slate-50 p-6">
                  <pre className="min-h-full whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
                    {signatureModal.contract?.onlineContract?.content}
                  </pre>
                </div>
                <div className="overflow-y-auto border-l border-slate-200 p-6">
                  <p className="text-sm font-bold text-ink">{language === 'vi' ? 'Chữ ký freelancer' : 'Freelancer signature'}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {language === 'vi' ? 'Upload ảnh chữ ký của bạn. Sau đó nhập họ tên đầy đủ để xác nhận.' : 'Upload your signature image. Then enter your full name to confirm.'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  {contractSignatureImage ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{language === 'vi' ? 'Preview chữ ký' : 'Signature preview'}</p>
                      <img src={contractSignatureImage} alt="Signature preview" className="max-h-36 w-full rounded-xl bg-white object-contain p-2" />
                    </div>
                  ) : null}
                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-slate-700">{language === 'vi' ? 'Họ tên xác nhận' : 'Confirmation name'}</span>
                    <input
                      value={contractSignature}
                      onChange={(event) => setContractSignature(event.target.value)}
                      placeholder={language === 'vi' ? 'Nhập họ tên đầy đủ để ký' : 'Enter your full name to sign'}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                  <button
                    onClick={() => signOnlineContract(signatureModal.contract)}
                    disabled={signingContract}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {signingContract ? (language === 'vi' ? 'Đang ký...' : 'Signing...') : (language === 'vi' ? 'Ký hợp đồng' : 'Sign contract')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {submitModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{language === 'vi' ? 'Nộp sản phẩm milestone' : 'Submit milestone work'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{submitModal.milestone?.title?.[language] || submitModal.milestone?.title?.vi || submitModal.milestone?.title?.en}</h3>
                  <p className="mt-2 text-sm text-slate-500">{language === 'vi' ? 'Tải tệp bàn giao lên và thêm ghi chú ngắn cho khách hàng.' : 'Upload the delivery file and a short note for the client.'}</p>
                </div>
                <button onClick={closeSubmitModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{language === 'vi' ? 'Ghi chú bàn giao' : 'Delivery note'}</span>
                  <textarea
                    value={submitForm.note}
                    onChange={(event) => setSubmitForm((current) => ({ ...current, note: event.target.value }))}
                    rows={4}
                    placeholder={language === 'vi' ? 'Tóm tắt những gì bạn đã hoàn thành, những gì khách hàng cần xem và các liên kết hoặc ghi chú quan trọng.' : 'Summarize what you completed, what the client should review, and any key links or notes.'}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{submitForm.file ? submitForm.file.name : (language === 'vi' ? 'Đính kèm tệp bàn giao' : 'Attach delivery file')}</p>
                      <p className="text-xs text-slate-500">{submitForm.file ? (language === 'vi' ? 'Tệp đã sẵn sàng để gửi cùng đợt nộp này.' : 'Ready to upload with this submission.') : (language === 'vi' ? 'Chọn ảnh, PDF, file nén hoặc bất kỳ tệp bàn giao nào.' : 'Choose an image, PDF, archive, or any handoff file.')}</p>
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
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={submitContractWork}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {submitting ? (language === 'vi' ? 'Đang nộp...' : 'Submitting...') : (language === 'vi' ? 'Nộp sản phẩm' : 'Submit Work')}
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
                  <p className="text-sm font-medium text-slate-500">{language === 'vi' ? 'Xem sản phẩm đã nộp' : 'Submitted work review'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-ink">{reviewModal.milestone?.title?.[language] || reviewModal.milestone?.title?.vi || reviewModal.milestone?.title?.en}</h3>
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
                        <p className="text-sm">{language === 'vi' ? 'Loại tệp này hiện chưa hỗ trợ xem trực tiếp, nhưng bạn có thể tải xuống bên dưới.' : 'Preview is not available for this file type, but you can download it below.'}</p>
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
                        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Download className="h-4 w-4" />
                        {language === 'vi' ? 'Tải tệp' : 'Download file'}
                      </a>
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
        onTopUp={topUpBalance}
        onWithdraw={() => setWithdrawModalOpen(true)}
      />,
    );

    return dashboardLayout(
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] 2xl:items-start">
        <SectionCard className="overflow-hidden border border-white/70 bg-white/75 p-0 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-xl">
          <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(0,179,134,0.22),transparent_28%),linear-gradient(145deg,#0B1020,#111A31_58%,#0E1630)] px-7 py-7 text-white">
            <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">{language === 'vi' ? 'Trung tâm rút tiền freelancer' : 'Freelancer payout center'}</p>
                  <p className="mt-4 break-words text-4xl font-bold tracking-tight text-white sm:text-5xl 2xl:text-6xl">{formatMoney(availableBalance)}</p>
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

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Action amount</p>
                  <input
                    value={walletAmount}
                    onChange={(event) => setWalletAmount(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/25"
                        placeholder="Enter amount, for example 500000"
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
                  <p className="mt-2 text-2xl font-bold text-white">1,860,000 VND</p>
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
              <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Lịch sử rút tiền' : 'Payout history'}</h2>
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
      <div className="grid items-start gap-6 2xl:h-[calc(100vh-12.5rem)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] 2xl:overflow-hidden">
        <SectionCard className="p-6 xl:flex xl:h-full xl:flex-col">
          <p className="muted">Payments</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Trung tâm rút tiền freelancer' : 'Freelancer payout center'}</h2>
          <div className="mt-6 rounded-[30px] bg-ink p-6 text-white xl:flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Available balance</p>
            <p className="mt-4 break-words text-4xl font-bold tracking-tight text-white sm:text-5xl 2xl:text-6xl">{formatMoney(availableBalance)}</p>
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
              <h2 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'Lịch sử rút tiền' : 'Payout history'}</h2>
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
      <AppErrorBoundary>
        <SettingsPanel user={user} onUserChange={setUser} initialSection="bank" mode="bank" />
      </AppErrorBoundary>,
    );
  }

  if (activePage === 'profile') {
    return <Navigate to={`/freelancer-profile/${user?.id || user?._id || 'me'}`} replace />;
  }

  if (activePage === 'disputes') {
    return dashboardLayout(
      <SectionCard className="p-6">
        <DisputeCenter role="freelancer" contracts={contractList} />
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
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="relative overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_12%_15%,rgba(0,179,134,0.34),transparent_28%),linear-gradient(135deg,#07111f,#0B1020_48%,#11223d)] p-7 text-white shadow-[0_28px_80px_rgba(11,16,32,0.22)]">
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-44 w-72 rounded-tl-[80px] bg-white/5" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  {language === 'vi' ? 'Không gian freelancer' : 'Freelancer workspace'}
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
                  {language === 'vi' ? 'Xây dựng uy tín, bàn giao công việc và theo dõi mọi khoản thanh toán rõ ràng.' : 'Build trust, deliver work, and track every payout clearly.'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
                  {language === 'vi' ? 'Bảng điều khiển của bạn hiển thị dữ liệu trực tiếp về công việc, hợp đồng, số dư và giao dịch từ nền tảng.' : 'Your dashboard only shows live marketplace, contract, wallet, and transaction data from the platform.'}
                </p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 text-right backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{language === 'vi' ? 'Số dư khả dụng' : 'Available balance'}</p>
                <p className="mt-3 text-4xl font-bold tracking-tight">{formatMoney(availableBalance)}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/12 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {language === 'vi' ? 'Sẵn sàng sử dụng' : 'Wallet ready'}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <BriefcaseBusiness className="h-5 w-5 text-emerald-200" />
                <p className="mt-4 text-2xl font-bold">{recommendedJobs.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Công việc mở' : 'Open jobs'}</p>
              </button>
              <button onClick={() => setActivePage('contracts')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <FileCheck2 className="h-5 w-5 text-sky-200" />
                <p className="mt-4 text-2xl font-bold">{activeContracts.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Hợp đồng đang hoạt động' : 'Active contracts'}</p>
              </button>
              <button onClick={() => setActivePage('contracts')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <TrendingUp className="h-5 w-5 text-violet-200" />
                <p className="mt-4 text-2xl font-bold">{declinedContractCount}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Dự án bị từ chối' : 'Declined projects'}</p>
              </button>
              <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12">
                <WalletCards className="h-5 w-5 text-amber-200" />
                <p className="mt-4 text-2xl font-bold">{formatMoney(pendingBalance)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{language === 'vi' ? 'Khoản chờ xử lý' : 'Pending escrow'}</p>
              </button>
            </div>
          </div>
        </div>

        <SectionCard className="flex flex-col justify-between overflow-hidden p-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="muted">{language === 'vi' ? 'Hiệu suất' : 'Performance'}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Tổng quan freelancer' : 'Freelancer pulse'}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Giá trị hợp đồng' : 'Contract value'}</p>
                <p className="mt-3 text-2xl font-bold text-ink">{formatMoney(totalContractValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Đã nhận' : 'Earned'}</p>
                <p className="mt-3 text-2xl font-bold text-emerald-600">{formatMoney(earnedValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Hoàn tất' : 'Completed'}</p>
                <p className="mt-3 text-2xl font-bold text-ink">{completedContracts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Các milestone' : 'Milestones'}</p>
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
                <p className="font-semibold text-ink">{language === 'vi' ? 'Chế độ làm việc được bảo vệ đang hoạt động' : 'Protected work mode is active'}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{language === 'vi' ? 'Bài nộp milestone, các khoản giải ngân và lịch sử thanh toán được kết nối trong cùng một quy trình.' : 'Milestone submissions, escrow releases, and payout history stay connected in one workflow.'}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="muted">{language === 'vi' ? 'Hàng đợi công việc' : 'Work queue'}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Hợp đồng đang hoạt động' : 'Active contracts'}</h2>
            </div>
            <button onClick={() => setActivePage('contracts')} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              {language === 'vi' ? 'Xem hợp đồng' : 'View contracts'}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {activeContracts.slice(0, 4).map((contract) => (
              <div
                key={contract.id}
                className="group w-full rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-ink">{contract.title?.[language] || contract.title?.vi || contract.title?.en}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contract.status === 'Declined' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>{localizeContractStatus(contract.status, language)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Ngân sách' : 'Budget'}</p>
                      <p className="mt-1 font-bold text-ink">{contract.budget}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{language === 'vi' ? 'Tiến độ' : 'Progress'}</p>
                      <p className="mt-1 font-bold text-emerald-600">{contract.progress}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all group-hover:from-emerald-400" style={{ width: `${contract.progress}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContractId(`${contract.id}`);
                      setActivePage('contracts');
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {language === 'vi' ? 'Xem hợp đồng' : 'View contract'}
                  </button>
                  {contract.status !== 'Declined' ? (
                    <button
                      type="button"
                      onClick={() => cancelAcceptedJob(contract)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      {language === 'vi' ? 'Hủy hợp đồng' : 'Cancel contract'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {activeContracts.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" />
                <h3 className="mt-4 text-lg font-bold text-ink">{language === 'vi' ? 'Chưa có hợp đồng đang hoạt động' : 'No active contracts yet'}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{language === 'vi' ? 'Các công việc đã được nhận từ MongoDB sẽ xuất hiện ở đây khi bạn bắt đầu làm việc với khách hàng.' : 'Accepted jobs from MongoDB will appear here once you start working with a client.'}</p>
                <button onClick={() => setActivePage('marketplace')} className="mt-5 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  {language === 'vi' ? 'Xem thị trường công việc' : 'Browse marketplace'}
                </button>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted">{language === 'vi' ? 'Dòng tiền' : 'Money flow'}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Tín hiệu thanh toán gần đây' : 'Recent payout signal'}</h2>
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
                  {language === 'vi' ? 'Chưa có biểu đồ giao dịch. Các khoản thanh toán và rút tiền sẽ tự động tạo biểu đồ này.' : 'No transaction chart yet. Released payments and withdrawals will draw this chart automatically.'}
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
                    <p className="truncate text-sm text-slate-500">{transaction.description || (language === 'vi' ? 'Đã ghi nhận giao dịch số dư.' : 'Wallet transaction recorded.')}</p>
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
              <p className="muted">{language === 'vi' ? 'Bước tiếp theo' : 'Next steps'}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Các milestone sắp tới' : 'Upcoming milestones'}</h2>
            </div>
            <CalendarClock className="h-6 w-6 text-indigo-500" />
          </div>

          <div className="mt-6 space-y-3">
            {nextMilestones.map((milestone, index) => (
              <div key={`${milestone.contractId}-${milestone.title?.[language] || milestone.title?.vi || milestone.title?.en}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{milestone.title?.[language] || milestone.title?.vi || milestone.title?.en}</p>
                    <p className="mt-1 text-sm text-slate-500">{milestone.contractTitle}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{localizeMilestoneStatus(milestone.status, language)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{language === 'vi' ? `Hạn ${milestone.dueDate}` : `Due ${milestone.dueDate}`}</span>
                  <span className="font-bold text-ink">{milestone.amount}</span>
                </div>
              </div>
            ))}

            {nextMilestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                  {language === 'vi' ? 'Hiện chưa có milestone nào chờ xử lý. Khi hợp đồng có việc cần nộp, nó sẽ xuất hiện ở đây.' : 'No pending milestones right now. When a contract has work to submit, it will show up here.'}
                </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="muted">{language === 'vi' ? 'Thị trường công việc' : 'Marketplace'}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{language === 'vi' ? 'Cơ hội mới' : 'Fresh opportunities'}</h2>
            </div>
            <button onClick={() => setActivePage('marketplace')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-pine hover:text-pine">
              {language === 'vi' ? 'Khám phá công việc' : 'Explore jobs'}
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
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{job.category || (language === 'vi' ? 'Công việc' : 'Job')}</span>
                <h3 className="mt-4 line-clamp-2 text-base font-bold text-ink">{job.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{job.client}</p>
                <p className="mt-5 text-xl font-bold text-ink">{job.budget}</p>
              </button>
            ))}

            {recommendedJobs.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500 lg:col-span-3">
                  {language === 'vi' ? 'Chưa có công việc mở nào từ cơ sở dữ liệu trong thị trường lúc này.' : 'No open marketplace jobs from the database yet.'}
                </div>
            ) : null}
          </div>
        </SectionCard>
      </section>
    </div>,
  );
}

export default FreelancerDashboard;









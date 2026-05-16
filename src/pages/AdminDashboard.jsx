import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  BriefcaseBusiness,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import KycAdminPanel from '../components/KycAdminPanel';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Topbar from '../components/Topbar';
import DisputeCenter from '../features/disputes/DisputeCenter';
import { persistLanguage } from '../utils/language';
import { normalizeMoneyDisplay } from '../utils/money';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const KYC_API_BASE = import.meta.env.VITE_KYC_API_URL || 'http://localhost:8001';
const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

const adminSidebarItems = [
  { label: 'Dashboard', page: 'overview' },
  { label: 'Users', page: 'users' },
  { label: 'Posts', page: 'posts' },
  { label: 'Contracts', page: 'contracts' },
  { label: 'Payments', page: 'payments' },
  { label: 'KYC', page: 'kyc' },
  { label: 'Reviews', page: 'reviews' },
  { label: 'Disputes', page: 'disputes' },
];

const adminLabels = {
  Dashboard: 'Tổng quan',
  Users: 'Người dùng',
  Posts: 'Bài đăng',
  Contracts: 'Hợp đồng',
  Payments: 'Thanh toán',
  Reviews: 'Đánh giá',
  Disputes: 'Tranh chấp',
  workspace: 'Không gian làm việc',
  trustCenter: 'Trung tâm quản trị',
  workspaceDesc: 'Trung tâm điều hành MongoDB cho người dùng, bài đăng, hợp đồng, tranh chấp và thanh toán.',
  balanceProtected: 'Tổng tiền bảo vệ',
  balanceDesc: 'Được tính từ các giao dịch trong cơ sở dữ liệu.',
};

const titles = {
  overview: 'Bảng điều khiển quản trị',
  users: 'Quản lý người dùng',
  posts: 'Kiểm duyệt bài đăng',
  contracts: 'Theo dõi hợp đồng',
  disputes: 'Trung tâm tranh chấp',
  payments: 'Điều phối thanh toán',
  reviews: 'Quản lý đánh giá',
};

function getAdminLabels(language) {
  if (language === 'vi') {
    return {
      Dashboard: 'Tổng quan',
      Users: 'Người dùng',
      Posts: 'Bài đăng',
      Contracts: 'Hợp đồng',
      Payments: 'Thanh toán',
      Reviews: 'Đánh giá',
      Disputes: 'Tranh chấp',
      workspace: 'Không gian làm việc',
      trustCenter: 'Trung tâm quản trị',
      workspaceDesc: 'Trung tâm điều hành kết nối MongoDB cho người dùng, bài đăng, hợp đồng, tranh chấp và thanh toán.',
      balanceProtected: 'Khối lượng được bảo vệ',
      balanceDesc: 'Được tính từ các giao dịch trong cơ sở dữ liệu.',
    };
  }

  return adminLabels;
}

function getAdminTitles(language) {
  if (language === 'vi') {
    return {
      overview: 'Bảng điều khiển quản trị',
      users: 'Quản lý người dùng',
      posts: 'Kiểm duyệt bài đăng',
      contracts: 'Theo dõi hợp đồng',
      disputes: 'Trung tâm tranh chấp',
      payments: 'Điều phối thanh toán',
      reviews: 'Quản lý đánh giá',
    };
  }

  return titles;
}

const emptyData = {
  users: [],
  posts: [],
  jobs: [],
  contracts: [],
  disputes: [],
  reviews: [],
  payments: [],
  stats: {
    totalUsers: 0,
    flaggedUsers: 0,
    postsPending: 0,
    postsFlagged: 0,
    totalContracts: 0,
    completedContracts: 0,
    openDisputes: 0,
    highSeverityDisputes: 0,
    totalReviews: 0,
    protectedVolume: '0 VND',
    paymentActions: 0,
  },
  charts: {
    moderationTrend: [],
    riskDistribution: [],
  },
};

function statusTone(status) {
  if (['Escalated', 'High', 'On Hold', 'Under Review', 'Rejected', 'Banned', 'Failed'].includes(status)) return 'bg-rose-100 text-rose-700';
  if (['Review', 'Medium', 'Queued', 'Needs Evidence', 'Pending Release', 'Pending', 'Flagged', 'Monitor'].includes(status)) return 'bg-amber-100 text-amber-700';
  if (['Healthy', 'Released', 'Completed', 'Low', 'Approved', 'Open', 'Assigned'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
}

function matchesSearch(item, search) {
  return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    Completed: 'Hoàn tất',
    Client: 'Client',
    Freelancer: 'Freelancer',
    Admin: 'Admin',
    Pending: 'Đang chờ',
    Failed: 'Thất bại',
    'On Hold': 'Đang giữ',
    'Under Review': 'Đang xem xét',
    Queued: 'Đang xếp hàng',
    'Needs Evidence': 'Cần bằng chứng',
    'Pending Release': 'Chờ giải ngân',
    Released: 'Đã giải ngân',
    Incoming: 'Tiền vào',
    Outgoing: 'Tiền ra',
    Healthy: 'Ổn định',
    Monitor: 'Theo dõi',
    Review: 'Cần xem xét',
    Escalated: 'Ưu tiên xử lý',
    Banned: 'Đã khóa',
    High: 'Cao',
    Medium: 'Trung bình',
    Low: 'Thấp',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Flagged: 'Đã gắn cờ',
    Open: 'Đang mở',
    Assigned: 'Đã nhận',
    Active: 'Đang chạy',
    'In Progress': 'Đang làm',
  };

  return labels[status] || status || 'Không xác định';
}

function translatePaymentText(text) {
  if (!text) return 'Giao dịch trong MongoDB';

  return `${text}`
    .replace('Wallet top-up from linked bank account', 'Nạp tiền ví từ tài khoản ngân hàng liên kết')
    .replace('Withdrawal to linked bank account', 'Rút tiền về tài khoản ngân hàng liên kết')
    .replace('Pending milestone payment for job:', 'Thanh toán milestone đang chờ cho công việc:')
    .replace('Milestone approved and paid for job:', 'Milestone đã duyệt và đã thanh toán cho công việc:')
    .replace('MongoDB transaction record', 'Bản ghi giao dịch trong MongoDB')
    .replace('Deposit transaction', 'Giao dịch nạp tiền')
    .replace('Withdrawal transaction', 'Giao dịch rút tiền')
    .replace('Release transaction', 'Giao dịch giải ngân')
    .replace('Refund transaction', 'Giao dịch hoàn tiền');
}

function isUnknownAccount(label) {
  return !label || label === 'Không xác định';
}

function accountDisplay(label, id) {
  if (!isUnknownAccount(label)) return label;
  return id ? `ID ${id}` : 'Chưa có dữ liệu tài khoản';
}

function paymentActorLines(item, group) {
  if (group === 'wallet') {
    return [`Tài khoản nạp: ${accountDisplay(item.toUserLabel, item.toUserId || item.fromUserId)}`];
  }

  const lines = [];
  if (!isUnknownAccount(item.fromUserLabel) || item.fromUserId) lines.push(`Từ: ${accountDisplay(item.fromUserLabel, item.fromUserId)}`);
  if (!isUnknownAccount(item.toUserLabel) || item.toUserId) lines.push(`Đến: ${accountDisplay(item.toUserLabel, item.toUserId)}`);
  return lines.length ? lines : ['Tài khoản: Chưa có dữ liệu tài khoản'];
}

function projectOptionLabel(item) {
  if (item.projectTitle) return item.projectTitle;
  const translated = translatePaymentText(item.contract || item.reason || '');
  const match = translated.match(/công việc:\s*(.+?)(?:\s+-\s+|$)/i);
  return match?.[1]?.trim() || 'Giao dịch không gắn dự án';
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';
  return date.toLocaleDateString('vi-VN');
}

function titleCase(value) {
  if (!value) return '';
  return `${value}`.charAt(0).toUpperCase() + `${value}`.slice(1);
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || '{}'));
  const [search, setSearch] = useState('');
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProjectKey, setSelectedProjectKey] = useState('all');
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState('');
  const language = user?.settings?.language || 'en';
  const dashboardLabels = getAdminLabels(language);
  const dashboardTitles = { ...getAdminTitles(language), kyc: 'Duyệt KYC' };

  const token = localStorage.getItem(TOKEN_KEY);

  const fetchAdminData = useCallback(async ({ silent = false } = {}) => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(nextData.message || 'Cannot load admin database data');
      }

      setData({ ...emptyData, ...nextData, charts: { ...emptyData.charts, ...(nextData.charts || {}) } });
    } catch (fetchError) {
      setError(fetchError.message);
      setData(emptyData);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [navigate, token]);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, fetchAdminData]);

  useEffect(() => {
    const refreshAdminData = () => {
      if (document.hidden) return;
      fetchAdminData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshAdminData();
    };

    const intervalId = window.setInterval(refreshAdminData, 8000);
    window.addEventListener('focus', refreshAdminData);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('fptp:notification', refreshAdminData);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshAdminData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('fptp:notification', refreshAdminData);
    };
  }, [fetchAdminData]);

  const apiPatch = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Admin action failed');
    }

    return result;
  };

  const apiDelete = async (path) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Admin delete failed');
    }

    return result;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const adminStats = useMemo(() => [
    { label: 'Tổng người dùng', value: `${data.stats.totalUsers}`, hint: `${data.stats.flaggedUsers} tài khoản cần chú ý`, icon: Users, accent: 'bg-pine/10 text-pine' },
    { label: 'Hợp đồng hoàn thành', value: `${data.stats.completedContracts}`, hint: `${data.stats.totalContracts} hợp đồng client-freelancer`, icon: BriefcaseBusiness, accent: 'bg-sky-100 text-sky-700' },
    { label: 'Tranh chấp mở', value: `${data.stats.openDisputes}`, hint: `${data.stats.highSeverityDisputes} mức độ cao`, icon: AlertTriangle, accent: 'bg-coral/10 text-coral' },
    { label: 'Tổng tiền bảo vệ', value: normalizeMoneyDisplay(data.stats.protectedVolume), hint: `${data.stats.paymentActions} giao dịch`, icon: BadgeDollarSign, accent: 'bg-gold/10 text-gold' },
  ], [data.stats]);

  const maxTrendValue = useMemo(() => Math.max(
    1,
    ...data.charts.moderationTrend.flatMap((item) => [item.disputes, item.posts, item.payments]),
  ), [data.charts.moderationTrend]);

  const filteredUsers = data.users.filter((item) => matchesSearch(item, search));
  const filteredPosts = data.posts.filter((item) => matchesSearch(item, search));
  const filteredContracts = data.contracts.filter((item) => matchesSearch(item, search));
  const filteredDisputes = data.disputes.filter((item) => matchesSearch(item, search));
  const filteredReviews = data.reviews.filter((item) => matchesSearch(item, search));
  const filteredPayments = data.payments.filter((item) => matchesSearch(item, search));
  const selectedUser = filteredUsers.find((item) => `${item.roleKey}-${item.id}` === selectedUserId) || filteredUsers[0] || null;
  const selectedPost = filteredPosts.find((item) => item.id === selectedPostId) || filteredPosts[0] || null;
  const selectedDispute = filteredDisputes.find((item) => item.id === selectedDisputeId) || filteredDisputes[0] || null;

  const updateUserModeration = async (item, body) => {
    try {
      const result = await apiPatch(`/admin/users/${item.roleKey}/${item.id}/moderation`, body);
      setData((current) => ({
        ...current,
        users: current.users.map((userItem) => (userItem.id === item.id && userItem.roleKey === item.roleKey ? result.user : userItem)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const updatePostStatus = async (item, moderationStatus) => {
    try {
      const result = await apiPatch(`/admin/jobs/${item.id}/moderation`, { moderationStatus });
      setData((current) => ({
        ...current,
        posts: current.posts.map((post) => (post.id === item.id ? result.post : post)),
        jobs: current.jobs.map((job) => (job.id === item.id ? result.post : job)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const updatePaymentState = async (item, status) => {
    try {
      const result = await apiPatch(`/admin/transactions/${item.id}/status`, { status });
      setData((current) => ({
        ...current,
        payments: current.payments.map((payment) => (payment.id === item.id ? result.payment : payment)),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const deleteReview = async (item) => {
    try {
      await apiDelete(`/admin/reviews/${item.id}`);
      setData((current) => ({
        ...current,
        reviews: current.reviews.filter((review) => review.id !== item.id),
        disputes: current.disputes.filter((dispute) => dispute.id !== item.id),
      }));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const updateReviewStatus = async (item, status) => {
    try {
      const result = await apiPatch(`/admin/reviews/${item.id}/status`, { status });
      setData((current) => {
        const nextDisputes = result.dispute
          ? current.disputes.map((dispute) => (dispute.id === item.id ? result.dispute : dispute))
          : current.disputes.filter((dispute) => dispute.id !== item.id);

        return {
          ...current,
          reviews: current.reviews.map((review) => (review.id === item.id ? result.review : review)),
          disputes: result.dispute && !current.disputes.some((dispute) => dispute.id === item.id)
            ? [result.dispute, ...nextDisputes]
            : nextDisputes,
        };
      });
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const overviewContent = (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
          <p className="muted">Biểu đồ MongoDB</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Hoạt động nền tảng trong tuần</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Dữ liệu trực tiếp</span>
          </div>

          {data.charts.moderationTrend.length ? (
            <div className="mt-8 flex h-72 items-end gap-4">
              {data.charts.moderationTrend.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-60 w-full items-end justify-center gap-1 rounded-3xl bg-slate-50 px-2 py-3">
                    <div className="w-3 rounded-full bg-indigo-500" style={{ height: `${Math.max(8, (item.disputes / maxTrendValue) * 180)}px` }} />
                    <div className="w-3 rounded-full bg-sky-500" style={{ height: `${Math.max(8, (item.posts / maxTrendValue) * 180)}px` }} />
                    <div className="w-3 rounded-full bg-amber-400" style={{ height: `${Math.max(8, (item.payments / maxTrendValue) * 180)}px` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu biểu đồ" description="Khi có công việc, đánh giá hoặc giao dịch, biểu đồ sẽ lấy dữ liệu từ MongoDB." />
          )}
        </SectionCard>

        <SectionCard className="p-6">
          <p className="muted">Phân bổ rủi ro</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Trạng thái người dùng</h2>
          <div className="mt-6 space-y-4">
            {data.charts.riskDistribution.length ? data.charts.riskDistribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{statusLabel(item.label)}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            )) : <EmptyState title="Chưa có người dùng" description="Các tài khoản MongoDB đã đăng ký sẽ xuất hiện tại đây." />}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Quản trị theo dữ liệu thật</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Chỉ hiển thị bản ghi MongoDB</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              Bảng quản trị này chỉ hiển thị các bản ghi do backend API trả về từ MongoDB.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setActiveTab('users')} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink">Xem người dùng</button>
              <button onClick={() => setActiveTab('posts')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Kiểm duyệt bài</button>
              <button onClick={fetchAdminData} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">Tải lại dữ liệu</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Công việc trong database</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.jobs.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Người dùng đã đăng ký</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.users.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Giao dịch</p>
                <p className="mt-2 text-3xl font-bold text-ink">{data.payments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const usersContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Quản lý người dùng" title="Hồ sơ tài khoản và kiểm soát rủi ro" placeholder="Tìm người dùng hoặc lý do" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-bold text-ink">Tài khoản</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{filteredUsers.length} user</span>
          </div>
          <div className="max-h-[660px] space-y-3 overflow-y-auto pr-1">
            {filteredUsers.length ? filteredUsers.map((item) => {
              const itemKey = `${item.roleKey}-${item.id}`;
              const isActive = selectedUser && `${selectedUser.roleKey}-${selectedUser.id}` === itemKey;

              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => setSelectedUserId(itemKey)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? 'border-teal-500 bg-white shadow-[0_16px_36px_rgba(15,118,110,0.12)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-sm font-bold text-teal-700">
                      {(item.name || item.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-bold text-ink">{item.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{statusLabel(item.role)} · {item.email}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">{item.warnings} cảnh báo · rủi ro {statusLabel(item.risk).toLowerCase()}</p>
                    </div>
                  </div>
                </button>
              );
            }) : <EmptyState title="Không tìm thấy người dùng" description="Chỉ tài khoản client, freelancer và admin thật trong MongoDB xuất hiện tại đây." />}
          </div>
        </div>

        <div className="min-h-[660px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {selectedUser ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-teal-50 text-2xl font-bold text-teal-700">
                    {(selectedUser.name || selectedUser.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Hồ sơ người dùng</p>
                    <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">{selectedUser.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedUser.status)}`}>{statusLabel(selectedUser.status)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedUser.risk)}`}>Rủi ro {statusLabel(selectedUser.risk).toLowerCase()}</span>
                  {selectedUser.bankAccount?.isFrozen ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Ngân hàng bị đóng băng</span> : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Vai trò</p>
                  <p className="mt-2 text-sm font-bold text-ink">{statusLabel(selectedUser.role)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số dư</p>
                  <p className="mt-2 text-sm font-bold text-ink">{normalizeMoneyDisplay(selectedUser.balance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Escrow</p>
                  <p className="mt-2 text-sm font-bold text-ink">{normalizeMoneyDisplay(selectedUser.escrowBalance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ngày tạo</p>
                  <p className="mt-2 text-sm font-bold text-ink">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-bold text-ink">Thông tin profile</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <p><span className="font-semibold text-slate-500">Công ty:</span> <span className="text-slate-700">{selectedUser.companyName || selectedUser.clientProfile?.companyName || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Website:</span> <span className="text-slate-700">{selectedUser.clientProfile?.companyWebsite || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Billing email:</span> <span className="text-slate-700">{selectedUser.clientProfile?.billingEmail || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Headline:</span> <span className="text-slate-700">{selectedUser.headline || selectedUser.freelancerProfile?.headline || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Portfolio:</span> <span className="text-slate-700">{selectedUser.freelancerProfile?.portfolioUrl || 'Chưa cập nhật'}</span></p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedUser.freelancerProfile?.skills?.length ? selectedUser.freelancerProfile.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>
                    )) : <span className="text-sm text-slate-500">Chưa có kỹ năng profile.</span>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-bold text-ink">Ngân hàng và kiểm duyệt</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <p><span className="font-semibold text-slate-500">Ngân hàng:</span> <span className="text-slate-700">{selectedUser.bankAccount?.bankName || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Chủ tài khoản:</span> <span className="text-slate-700">{selectedUser.bankAccount?.accountName || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">Số tài khoản:</span> <span className="text-slate-700">{selectedUser.bankAccount?.accountNumber || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-semibold text-slate-500">SWIFT:</span> <span className="text-slate-700">{selectedUser.bankAccount?.swiftCode || 'Chưa cập nhật'}</span></p>
                    <p>
                      <span className="font-semibold text-slate-500">Trạng thái ngân hàng:</span>{' '}
                      <span className={selectedUser.bankAccount?.isFrozen ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>
                        {selectedUser.bankAccount?.isFrozen ? 'Đang đóng băng' : 'Đang hoạt động'}
                      </span>
                    </p>
                    {selectedUser.bankAccount?.isFrozen ? (
                      <p><span className="font-semibold text-slate-500">Lý do đóng băng:</span> <span className="text-slate-700">{selectedUser.bankAccount?.frozenReason || 'Không có ghi chú'}</span></p>
                    ) : null}
                    <p><span className="font-semibold text-slate-500">Lý do:</span> <span className="text-slate-700">{selectedUser.reason || 'Không có ghi chú'}</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div className="flex flex-wrap justify-end gap-3">
                  <button onClick={() => updateUserModeration(selectedUser, { action: 'status', status: 'Review' })} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cần xem xét</button>
                  <button onClick={() => updateUserModeration(selectedUser, { action: 'warn' })} className="rounded-xl border border-indigo-300 px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Cảnh báo</button>
                  <button onClick={() => updateUserModeration(selectedUser, { action: 'status', status: 'Escalated' })} className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50">Ưu tiên</button>
                  <button
                    onClick={() => updateUserModeration(selectedUser, { action: selectedUser.bankAccount?.isFrozen ? 'unfreezeBank' : 'freezeBank' })}
                    className={`rounded-xl border px-5 py-3 text-sm font-semibold ${selectedUser.bankAccount?.isFrozen ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-rose-300 text-rose-700 hover:bg-rose-50'}`}
                  >
                    {selectedUser.bankAccount?.isFrozen ? 'Mở băng ngân hàng' : 'Đóng băng ngân hàng'}
                  </button>
                  <button onClick={() => updateUserModeration(selectedUser, { action: selectedUser.banned ? 'unban' : 'ban' })} className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${selectedUser.banned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    {selectedUser.banned ? 'Mở khóa' : 'Khóa'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Chưa chọn người dùng" description="Chọn một tài khoản trong danh sách để xem hồ sơ." />
          )}
        </div>
      </div>
    </SectionCard>
  );

  const postsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Kiểm duyệt bài đăng" title="Xem nội dung và xử lý bài đăng" placeholder="Tìm bài đăng hoặc tác giả" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-bold text-ink">Danh sách bài đăng</p>
            <div className="flex items-center gap-2">
              <button onClick={fetchAdminData} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Tải lại</button>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{filteredPosts.length} bài</span>
            </div>
          </div>
          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {filteredPosts.length ? filteredPosts.map((item) => {
              const isActive = selectedPost?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPostId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? 'border-teal-500 bg-white shadow-[0_16px_36px_rgba(15,118,110,0.12)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-base font-bold text-ink">{item.title}</h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.author || 'Không rõ client'} · {item.budget}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.category}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{item.jobStatus}</span>
                  </div>
                </button>
              );
            }) : <EmptyState title="Không có bài cần duyệt" description="Bài đăng công việc từ MongoDB sẽ xuất hiện tại đây." />}
          </div>
        </div>

        <div className="min-h-[640px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {selectedPost ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Hồ sơ bài đăng</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">{selectedPost.title}</h3>
                  <p className="mt-3 text-sm text-slate-500">{selectedPost.author || 'Không rõ client'} · {selectedPost.category}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedPost.status)}`}>{statusLabel(selectedPost.status)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{selectedPost.jobStatus}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ngân sách</p>
                  <p className="mt-2 text-lg font-bold text-ink">{normalizeMoneyDisplay(selectedPost.budget)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Báo cáo</p>
                  <p className="mt-2 text-lg font-bold text-ink">{selectedPost.reports || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Nguồn</p>
                  <p className="mt-2 text-lg font-bold text-ink">MongoDB</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-ink">Nội dung bài đăng</p>
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  {selectedPost.description || 'Bài đăng này chưa có mô tả.'}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-ink">Kỹ năng yêu cầu</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPost.skills?.length ? selectedPost.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>
                  )) : <span className="text-sm text-slate-500">Chưa có kỹ năng.</span>}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">Milestone của bài đăng</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {(selectedPost.contractMilestones?.length || selectedPost.milestones?.length || 0)} milestone
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {(selectedPost.contractMilestones?.length ? selectedPost.contractMilestones : selectedPost.milestones || []).length ? (
                    (selectedPost.contractMilestones?.length ? selectedPost.contractMilestones : selectedPost.milestones).map((milestone, index) => (
                      <div key={milestone.id || `${milestone.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Milestone {index + 1}</p>
                            <h4 className="mt-1 text-sm font-bold text-ink">{milestone.title}</h4>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(milestone.status)}`}>{statusLabel(milestone.status)}</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số tiền</p>
                            <p className="mt-1 text-sm font-bold text-ink">{normalizeMoneyDisplay(milestone.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hạn</p>
                            <p className="mt-1 text-sm font-bold text-ink">{milestone.dueDate || 'Chưa đặt'}</p>
                          </div>
                        </div>
                        {milestone.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{milestone.description}</p> : null}
                        {milestone.submissionFileName ? <p className="mt-3 text-xs font-semibold text-slate-500">File đã nộp: {milestone.submissionFileName}</p> : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      Bài đăng này chưa có milestone.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="mb-3 text-sm text-slate-500">{selectedPost.reason}</p>
                <div className="flex flex-wrap justify-end gap-3">
                  <button onClick={() => updatePostStatus(selectedPost, 'approved')} className="rounded-xl border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Duyệt</button>
                  <button onClick={() => updatePostStatus(selectedPost, 'flagged')} className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50">Gắn cờ</button>
                  <button onClick={() => updatePostStatus(selectedPost, 'rejected')} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700">Từ chối</button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Chưa chọn bài đăng" description="Chọn một bài trong danh sách để xem đầy đủ nội dung." />
          )}
        </div>
      </div>
    </SectionCard>
  );

  const contractsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Theo dõi hợp đồng" title="Công việc đã nhận và trạng thái hợp đồng" placeholder="Tìm hợp đồng hoặc chủ sở hữu" search={search} setSearch={setSearch} />
      <div className="mt-6 space-y-4">
        {filteredContracts.length ? filteredContracts.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-ink">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.state)}`}>{statusLabel(item.state)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.payoutRisk)}`}>Rủi ro thanh toán {statusLabel(item.payoutRisk).toLowerCase()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.owner}</p>
                <p className="mt-3 text-sm text-slate-600">Số tiền bảo vệ {normalizeMoneyDisplay(item.amount)} · tiến độ hiện tại {item.progress}</p>
              </div>
            </div>
          </div>
        )) : <EmptyState title="Chưa có hợp đồng hoạt động" description="Khi freelancer nhận công việc, bản ghi hợp đồng sẽ xuất hiện tại đây." />}
      </div>
    </SectionCard>
  );

  const disputesContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Trung tâm tranh chấp" title="Xử lý đánh giá bị khiếu nại" placeholder="Tìm tranh chấp, người gửi hoặc người nhận" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-bold text-ink">Hàng chờ tranh chấp</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{filteredDisputes.length} vụ</span>
          </div>
          <div className="max-h-[660px] space-y-3 overflow-y-auto pr-1">
            {filteredDisputes.length ? filteredDisputes.map((item) => {
              const isActive = selectedDispute?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDisputeId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? 'border-rose-400 bg-white shadow-[0_16px_36px_rgba(225,29,72,0.10)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">Từ {item.reviewerLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">Đến {item.recipientLabel}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(item.severity)}`}>{statusLabel(item.severity)}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                </button>
              );
            }) : <EmptyState title="Không có tranh chấp" description="Các đánh giá đang chờ xử lý hoặc bị từ chối sẽ xuất hiện tại đây." />}
          </div>
        </div>

        <div className="min-h-[660px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {selectedDispute ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Hồ sơ tranh chấp</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">{selectedDispute.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">Ngày tạo: {formatDate(selectedDispute.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedDispute.severity)}`}>{statusLabel(selectedDispute.severity)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(titleCase(selectedDispute.status))}`}>{statusLabel(titleCase(selectedDispute.status))}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Điểm TB</p>
                  <p className="mt-2 text-lg font-bold text-ink">{selectedDispute.averageRating}/5</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hiển thị</p>
                  <p className="mt-2 text-lg font-bold text-ink">{selectedDispute.visibility === 'private' ? 'Riêng tư' : 'Công khai'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Vai trò</p>
                  <p className="mt-2 text-lg font-bold text-ink">{statusLabel(titleCase(selectedDispute.reviewerRole))}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-bold text-ink">Người đánh giá</p>
                  <p className="mt-3 text-sm text-slate-600">{selectedDispute.reviewerLabel}</p>
                  <p className="mt-5 text-sm font-bold text-ink">Người nhận</p>
                  <p className="mt-3 text-sm text-slate-600">{selectedDispute.recipientLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-bold text-ink">Liên kết hợp đồng</p>
                  <p className="mt-3 text-sm text-slate-600">Contract: {selectedDispute.contractId || 'Không có'}</p>
                  <p className="mt-2 text-sm text-slate-600">Milestone: {selectedDispute.milestoneId || 'Không có'}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-ink">Nội dung tranh chấp</p>
                <p className="mt-3 min-h-24 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">{selectedDispute.summary}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Object.entries(reviewMetricLabels).map(([key, label]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600">{label}</span>
                      <span className="font-bold text-ink">{selectedDispute.rating?.[key] || 0}/5</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(100, ((selectedDispute.rating?.[key] || 0) / 5) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <div className="flex flex-wrap justify-end gap-3">
                  <button onClick={() => updateReviewStatus(selectedDispute, 'approved')} className="rounded-xl border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Duyệt đánh giá</button>
                  <button onClick={() => updateReviewStatus(selectedDispute, 'rejected')} className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50">Từ chối đánh giá</button>
                  <button onClick={() => deleteReview(selectedDispute)} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700">Xóa tranh chấp</button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Chưa chọn tranh chấp" description="Chọn một vụ trong hàng chờ để xem và xử lý." />
          )}
        </div>
      </div>
    </SectionCard>
  );

  const reviewMetricLabels = {
    communication: 'Giao tiếp',
    quality: 'Chất lượng',
    timeliness: 'Đúng hạn',
    professionalism: 'Chuyên nghiệp',
  };

  const reviewsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Quản lý đánh giá" title="Kiểm tra và xóa đánh giá" placeholder="Tìm đánh giá, người gửi hoặc người nhận" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {filteredReviews.length ? filteredReviews.map((item) => (
          <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(titleCase(item.status))}`}>{statusLabel(titleCase(item.status))}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.visibility === 'private' ? 'Riêng tư' : 'Công khai'}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink">{item.averageRating}/5 điểm trung bình</h3>
                <p className="mt-2 text-sm text-slate-500">Người đánh giá: {item.reviewerLabel}</p>
                <p className="mt-1 text-sm text-slate-500">Người nhận: {item.recipientLabel}</p>
              </div>
              <button onClick={() => deleteReview(item)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Xóa đánh giá</button>
            </div>

            <p className="mt-4 min-h-16 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {item.comment || 'Đánh giá này không có nội dung bình luận.'}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(reviewMetricLabels).map(([key, label]) => (
                <div key={key} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{label}</span>
                    <span className="font-bold text-ink">{item.rating?.[key] || 0}/5</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(100, ((item.rating?.[key] || 0) / 5) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <p>Contract: {item.contractId || 'Không có'}</p>
              <p>Milestone: {item.milestoneId || 'Không có'}</p>
              <p>Vai trò người đánh giá: {statusLabel(titleCase(item.reviewerRole))}</p>
              <p>Ngày tạo: {formatDate(item.createdAt)}</p>
            </div>
          </div>
        )) : <EmptyState title="Không có đánh giá" description="Các đánh giá từ MongoDB sẽ xuất hiện tại đây để admin kiểm tra." />}
      </div>
    </SectionCard>
  );

  const topUpPayments = filteredPayments.filter((item) => item.type === 'deposit' && !item.jobId);
  const projectPayments = filteredPayments.filter((item) => item.type !== 'deposit' || item.jobId);
  const topUpTotal = topUpPayments.reduce((sum, item) => sum + Number(`${item.amount || ''}`.replace(/[^0-9]/g, '') || 0), 0);
  const projectOptions = Array.from(projectPayments.reduce((options, item) => {
    const key = item.jobId || '__no_project__';
    if (!options.has(key)) {
      options.set(key, {
        key,
        label: key === '__no_project__' ? 'Giao dịch không gắn dự án' : projectOptionLabel(item),
        count: 0,
      });
    }
    const option = options.get(key);
    option.count += 1;
    return options;
  }, new Map()).values()).sort((a, b) => {
    if (a.key === '__no_project__') return 1;
    if (b.key === '__no_project__') return -1;
    return a.label.localeCompare(b.label, 'vi');
  });
  const visibleProjectPayments = selectedProjectKey === 'all'
    ? projectPayments
    : projectPayments.filter((item) => (item.jobId || '__no_project__') === selectedProjectKey);
  const projectTotal = visibleProjectPayments.reduce((sum, item) => sum + Number(`${item.amount || ''}`.replace(/[^0-9]/g, '') || 0), 0);
  const renderPaymentRows = (items, emptyTitle, emptyDescription, group) => (
    <div className="mt-5 max-h-[680px] space-y-3 overflow-y-auto pr-1">
      {items.length ? items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-bold text-ink">{translatePaymentText(item.contract)}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{translatePaymentText(item.reason)}</p>
              <div className="mt-3 space-y-1 rounded-2xl bg-slate-50 px-3 py-2">
                {paymentActorLines(item, group).map((line) => (
                  <p key={line} className="text-xs font-semibold text-slate-600">{line}</p>
                ))}
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(item.state)}`}>{statusLabel(item.state)}</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{statusLabel(item.account)}</p>
              <p className="mt-1 text-lg font-bold text-ink">{normalizeMoneyDisplay(item.amount)}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => updatePaymentState(item, 'pending')} className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50">Giữ</button>
              <button onClick={() => updatePaymentState(item, 'completed')} className="rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Hoàn tất</button>
              <button onClick={() => updatePaymentState(item, 'failed')} className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Lỗi</button>
            </div>
          </div>
        </div>
      )) : <EmptyState title={emptyTitle} description={emptyDescription} />}
    </div>
  );

  const paymentsContent = (
    <SectionCard className="p-6">
      <TableHeader eyebrow="Điều phối thanh toán" title="Lịch sử giao dịch từ MongoDB" placeholder="Tìm giao dịch hoặc tài khoản" search={search} setSearch={setSearch} />
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/45 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nạp ví</p>
              <h3 className="mt-1 text-xl font-bold text-ink">Nạp tiền ví</h3>
              <p className="mt-2 text-sm text-slate-500">Tiền người dùng nạp vào ví nền tảng.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">{topUpPayments.length} giao dịch</span>
          </div>
          <p className="mt-5 text-3xl font-bold text-emerald-700">{normalizeMoneyDisplay(topUpTotal)}</p>
          {renderPaymentRows(topUpPayments, 'Chưa có giao dịch nạp tiền', 'Các giao dịch nạp tiền vào ví sẽ xuất hiện ở nhóm này.', 'wallet')}
        </div>

        <div className="rounded-[28px] border border-sky-100 bg-sky-50/45 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dự án</p>
              <h3 className="mt-1 text-xl font-bold text-ink">Tiền dự án</h3>
              <p className="mt-2 text-sm text-slate-500">Tiền liên quan đến milestone, giải ngân và rút tiền.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">{visibleProjectPayments.length} giao dịch</span>
          </div>
          <label className="mt-5 block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Chọn dự án</span>
            <select
              value={selectedProjectKey}
              onChange={(event) => setSelectedProjectKey(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              <option value="all">Tất cả dự án và giao dịch ({projectPayments.length})</option>
              {projectOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label} ({option.count})</option>
              ))}
            </select>
          </label>
          <p className="mt-5 text-3xl font-bold text-sky-700">{normalizeMoneyDisplay(projectTotal)}</p>
          {renderPaymentRows(visibleProjectPayments, 'Chưa có giao dịch tiền dự án', 'Các giao dịch milestone, giải ngân và rút tiền sẽ xuất hiện ở nhóm này.', 'project')}
        </div>
      </div>
    </SectionCard>
  );

  const integratedDisputesContent = (
    <SectionCard className="p-6">
      <DisputeCenter role="admin" contracts={data.contracts} />
    </SectionCard>
  );

  const kycContent = <KycAdminPanel />;

  const tabContent = {
    overview: overviewContent,
    users: usersContent,
    posts: postsContent,
    contracts: contractsContent,
    disputes: integratedDisputesContent,
    kyc: kycContent,
    reviews: reviewsContent,
    payments: paymentsContent,
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
          <Sidebar items={adminSidebarItems} activePage={activeTab} onNavigate={setActiveTab} labels={dashboardLabels} balanceValue={normalizeMoneyDisplay(data.stats.protectedVolume)} />
          <div className="min-w-0 flex-1 space-y-6">
            <Topbar
              title={dashboardTitles[activeTab]}
              subtitle="Không gian quản trị được kết nối với MongoDB"
            onLogout={logout}
            onOpenSettings={() => setActiveTab('overview')}
            onOpenBankSettings={() => setActiveTab('payments')}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
              copy={{ role: 'quản trị viên', logout: 'Đăng xuất' }}
              user={user}
            />

            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {loading ? (
              <SectionCard className="p-8">
                <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu MongoDB...</p>
              </SectionCard>
          ) : tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ eyebrow, title, placeholder, search, setSearch }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="muted">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72" />
      </label>
    </div>
  );
}

export default AdminDashboard;

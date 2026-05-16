import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, Mail, Shield, Star, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/appData';
import { persistLanguage } from '../utils/language';
import { formatMoney } from '../utils/money';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('fptp_user') || '{}');
  } catch {
    return {};
  }
}

function ClientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId } = useParams();
  const [user, setUser] = useState(readStoredUser);
  const language = user?.settings?.language || 'en';
  const isVietnamese = language === 'vi';
  const seed = location.state?.profileSeed || {};
  const clientProfile = user?.settings?.clientProfile || {};
  const bankAccount = user?.settings?.bankAccount || {};
  const displayName = user?.fullName || user?.companyName || seed.fullName || user?.email || (isVietnamese ? 'Khách hàng' : 'Client');
  const email = user?.email || seed.email || '';
  const isOwnProfile = String(profileId || '') === String(user?.id || user?._id || '') || profileId === 'me';

  const labels = {
    Dashboard: isVietnamese ? 'Tổng quan' : 'Dashboard',
    Profile: isVietnamese ? 'Hồ sơ' : 'Profile',
    Jobs: isVietnamese ? 'Công việc' : 'Jobs',
    Contracts: isVietnamese ? 'Hợp đồng' : 'Contracts',
    Chat: isVietnamese ? 'Trò chuyện' : 'Chat',
    'Bank Account': isVietnamese ? 'Tài khoản ngân hàng' : 'Bank Account',
    Payments: isVietnamese ? 'Thanh toán' : 'Payments',
    Disputes: isVietnamese ? 'Tranh chấp' : 'Disputes',
    workspace: isVietnamese ? 'Không gian làm việc' : 'Workspace',
    trustCenter: isVietnamese ? 'Bảng điều khiển khách hàng' : 'Client Console',
    workspaceDesc: isVietnamese
      ? 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.'
      : 'Manage hiring, approvals, payments, and disputes from one client command center.',
    balanceProtected: isVietnamese ? 'Số dư khả dụng' : 'Available balance',
    balanceDesc: isVietnamese ? 'Số dư dùng chung cho các hợp đồng với đối tác của bạn.' : 'Shared balance used across your supplier contracts.',
  };

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

  const handleSidebarNavigate = (page) => {
    if (page === 'profile') return;
    navigate('/client-dashboard', { state: { initialPage: page } });
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="profile" onNavigate={handleSidebarNavigate} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={isVietnamese ? 'Hồ sơ khách hàng' : 'Client Profile'}
            subtitle={isVietnamese ? 'Thông tin tuyển dụng, thanh toán và độ tin cậy của khách hàng' : 'Hiring, payment, and client trust information'}
            onLogout={logout}
            onOpenSettings={() => navigate('/client-dashboard', { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate('/client-dashboard', { state: { initialPage: 'bank' } })}
            language={language}
            onLanguageChange={handleLanguageChange}
            copy={{ role: isVietnamese ? 'khách hàng' : 'client', logout: isVietnamese ? 'Đăng xuất' : 'Logout' }}
            user={user}
          />

          <button
            type="button"
            onClick={() => navigate('/client-dashboard')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {isVietnamese ? 'Quay lại bảng điều khiển' : 'Back to dashboard'}
          </button>

          <SectionCard className="overflow-hidden p-0">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="bg-ink px-6 py-8 text-white sm:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {isVietnamese ? 'Khách hàng' : 'Client'}
                  </span>
                  {isOwnProfile ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                      <BadgeCheck className="h-4 w-4" />
                      {isVietnamese ? 'Hồ sơ của bạn' : 'Your profile'}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-5 text-4xl font-bold tracking-tight">{displayName}</h2>
                <p className="mt-3 max-w-3xl text-lg text-white/80">
                  {clientProfile.companyName || user?.companyName || (isVietnamese ? 'Khách hàng đang tuyển dụng trên nền tảng' : 'Hiring client on the platform')}
                </p>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">
                  {isVietnamese
                    ? 'Hồ sơ này giúp freelancer hiểu khách hàng, phạm vi tuyển dụng, tín hiệu thanh toán và mức độ tin cậy trước khi gửi chào giá.'
                    : 'This profile helps freelancers understand the client, hiring scope, payment signals, and trust context before sending proposals.'}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">{isVietnamese ? 'Công việc đã đăng' : 'Posted jobs'}</p>
                    <p className="mt-2 text-2xl font-bold">{user?.postedJobs || 0}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">{isVietnamese ? 'Hợp đồng hoạt động' : 'Active contracts'}</p>
                    <p className="mt-2 text-2xl font-bold">{user?.activeContracts || 0}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">{isVietnamese ? 'Thanh toán' : 'Payments'}</p>
                    <p className="mt-2 text-2xl font-bold">{formatMoney(user?.balance || 0)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">{isVietnamese ? 'Phản hồi' : 'Response'}</p>
                    <p className="mt-2 text-2xl font-bold">{isVietnamese ? 'Linh hoạt' : 'Flexible'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-8 sm:px-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                      <Mail className="h-5 w-5 text-pine" />
                      {email || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">{isVietnamese ? 'Công ty' : 'Company'}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                      <Building2 className="h-5 w-5 text-pine" />
                      {clientProfile.companyName || user?.companyName || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">{isVietnamese ? 'Tài khoản ngân hàng' : 'Bank account'}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                      <WalletCards className="h-5 w-5 text-pine" />
                      {bankAccount.bankName || (isVietnamese ? 'Chưa thiết lập' : 'Not set')}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">{isVietnamese ? 'Tín hiệu tin cậy' : 'Trust signal'}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                      <Shield className="h-5 w-5 text-pine" />
                      {isVietnamese ? 'Đã xác thực tài khoản' : 'Account verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-pine/10 p-3 text-pine">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="muted">{isVietnamese ? 'Tín hiệu tuyển dụng' : 'Hiring signal'}</p>
                  <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Thông tin giúp freelancer tự tin chào giá' : 'Information for freelancer confidence'}</h3>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="muted">{isVietnamese ? 'Lịch sử hợp tác' : 'Collaboration history'}</p>
                  <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Đánh giá từ freelancer' : 'Freelancer feedback'}</h3>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-6 xl:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="muted">{isVietnamese ? 'Công việc gần đây' : 'Recent work'}</p>
                  <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Các brief và hợp đồng nổi bật' : 'Featured briefs and contracts'}</h3>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientProfile;

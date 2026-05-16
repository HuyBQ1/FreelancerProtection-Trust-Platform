import { BadgeCheck, BriefcaseBusiness, Building2, Mail, Star, UserRound, WalletCards } from 'lucide-react';
import SectionCard from './SectionCard';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function MyProfilePanel({ user, language = 'en', role = 'freelancer', onEditProfile, onOpenBank }) {
  const isVietnamese = language === 'vi';
  const displayName = user?.fullName || user?.companyName || user?.email || (isVietnamese ? 'Người dùng' : 'User');
  const email = user?.email || 'user@example.com';
  const avatar = user?.avatar || '';
  const settings = user?.settings || {};
  const freelancerProfile = settings.freelancerProfile || {};
  const clientProfile = settings.clientProfile || {};
  const bankAccount = settings.bankAccount || {};
  const isClient = role === 'client';

  const headline = isClient
    ? clientProfile.companyName || user?.companyName || (isVietnamese ? 'Khách hàng trên nền tảng' : 'Client on the platform')
    : freelancerProfile.headline || (isVietnamese ? 'Freelancer trên nền tảng' : 'Freelancer on the platform');

  const quickFacts = isClient
    ? [
        { label: isVietnamese ? 'Vai trò' : 'Role', value: isVietnamese ? 'Khách hàng' : 'Client', icon: Building2 },
        { label: isVietnamese ? 'Email thanh toán' : 'Billing email', value: clientProfile.billingEmail || email, icon: Mail },
        { label: isVietnamese ? 'Ngân hàng' : 'Bank account', value: bankAccount.bankName || (isVietnamese ? 'Chưa thiết lập' : 'Not set'), icon: WalletCards },
      ]
    : [
        { label: isVietnamese ? 'Vai trò' : 'Role', value: 'Freelancer', icon: BriefcaseBusiness },
        { label: isVietnamese ? 'Kỹ năng' : 'Skills', value: freelancerProfile.skills || (isVietnamese ? 'Chưa cập nhật' : 'Not updated'), icon: BadgeCheck },
        { label: isVietnamese ? 'Đánh giá' : 'Rating', value: user?.rating ? `${user.rating}/5` : (isVietnamese ? 'Chưa có' : 'No reviews yet'), icon: Star },
      ];

  return (
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pine/10 text-2xl font-bold text-pine">
                {avatar ? <img src={avatar} alt={displayName} className="h-full w-full object-cover" /> : getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{isVietnamese ? 'Hồ sơ của tôi' : 'My profile'}</p>
                <h2 className="mt-1 truncate text-3xl font-bold text-ink">{displayName}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{headline}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {quickFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                      <Icon className="h-4 w-4" />
                      {fact.label}
                    </p>
                    <p className="mt-3 break-words text-sm font-semibold text-ink">{fact.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold text-ink">{isVietnamese ? 'Thao tác nhanh' : 'Quick actions'}</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={onEditProfile}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <UserRound className="h-4 w-4" />
                {isVietnamese ? 'Chỉnh sửa hồ sơ' : 'Edit profile'}
              </button>
              <button
                type="button"
                onClick={onOpenBank}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <WalletCards className="h-4 w-4" />
                {isVietnamese ? 'Tài khoản ngân hàng' : 'Bank account'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-6">
        <p className="text-sm font-medium text-slate-500">{isVietnamese ? 'Thông tin hiển thị' : 'Public information'}</p>
        <h3 className="mt-1 text-xl font-bold text-ink">
          {isClient
            ? (isVietnamese ? 'Thông tin khách hàng' : 'Client information')
            : (isVietnamese ? 'Thông tin freelancer' : 'Freelancer information')}
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              {isClient ? (isVietnamese ? 'Công ty' : 'Company') : (isVietnamese ? 'Tiêu đề nghề nghiệp' : 'Headline')}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {isClient
                ? clientProfile.companyName || user?.companyName || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')
                : freelancerProfile.headline || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              {isClient ? (isVietnamese ? 'Website' : 'Website') : (isVietnamese ? 'Portfolio' : 'Portfolio')}
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
              {isClient
                ? clientProfile.companyWebsite || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')
                : freelancerProfile.portfolioUrl || (isVietnamese ? 'Chưa cập nhật' : 'Not updated')}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default MyProfilePanel;

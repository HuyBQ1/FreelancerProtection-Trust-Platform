import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  MapPin,
  Shield,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SectionCard from '../components/SectionCard';
import { freelancerProfiles, sidebarItems } from '../data/appData';
import { persistLanguage } from '../utils/language';
import { formatMoney } from '../utils/money';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

const baseLabels = {
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
  workspaceDesc: 'Manage jobs, contracts, payouts, and disputes from one freelancer workspace.',
  balanceProtected: 'Available balance',
  balanceDesc: 'Shared across your active contracts and payout activity.',
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('fptp_user') || '{}');
  } catch {
    return {};
  }
}

function getCvPreviewType(profile) {
  const fileType = `${profile?.cvFileType || ''}`.toLowerCase();
  const fileName = `${profile?.cvFileName || ''}`.toLowerCase();
  const dataUrl = `${profile?.cvDataUrl || ''}`.toLowerCase();

  if (fileType.startsWith('image/') || dataUrl.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName)) {
    return 'image';
  }

  if (fileType === 'application/pdf' || dataUrl.startsWith('data:application/pdf') || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  return 'file';
}

function CvPreview({ profile, language, compact = false }) {
  const previewType = getCvPreviewType(profile);
  const unavailableText = language === 'vi'
    ? 'File Word không thể xem trực tiếp trong trang. Hãy upload CV dạng ảnh hoặc PDF để hiện preview.'
    : 'Word files cannot be previewed directly here. Upload an image or PDF CV to show a preview.';

  if (!profile?.cvDataUrl) return null;

  if (previewType === 'image') {
    return (
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${compact ? 'h-48' : 'max-h-[720px]'}`}>
        <img
          src={profile.cvDataUrl}
          alt={profile.cvFileName || 'CV preview'}
          className={`w-full bg-white object-contain ${compact ? 'h-full' : 'max-h-[720px]'}`}
        />
      </div>
    );
  }

  if (previewType === 'pdf') {
    return (
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${compact ? 'h-56' : 'h-[720px]'}`}>
        <iframe
          src={profile.cvDataUrl}
          title={profile.cvFileName || 'CV preview'}
          className="h-full w-full bg-white"
        />
      </div>
    );
  }

  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{unavailableText}</div>;
}

function normalizePublicFreelancerProfile(rawProfile, fallback = {}) {
  const freelancerProfile = rawProfile?.settings?.freelancerProfile || {};

  return {
    ...fallback,
    ...rawProfile,
    fullName: rawProfile?.fullName || fallback.fullName || rawProfile?.email || 'Freelancer',
    headline: rawProfile?.headline || freelancerProfile.headline || fallback.headline || '',
    summary: freelancerProfile.summary || fallback.summary || '',
    specialty: freelancerProfile.specialty || fallback.specialty || 'Freelancer',
    skills: Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0
      ? freelancerProfile.skills
      : fallback.skills || [],
    portfolioUrl: freelancerProfile.portfolioUrl || fallback.portfolioUrl || '',
    cvDataUrl: freelancerProfile.cvDataUrl || rawProfile?.cvDataUrl || fallback.cvDataUrl || '',
    cvFileName: freelancerProfile.cvFileName || rawProfile?.cvFileName || fallback.cvFileName || '',
    cvFileType: freelancerProfile.cvFileType || rawProfile?.cvFileType || fallback.cvFileType || '',
  };
}

function FreelancerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId } = useParams();
  const [user, setUser] = useState(readStoredUser);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [profileReviews, setProfileReviews] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(user?.balance || 0);

  const language = user?.settings?.language || 'en';
  const isVietnamese = language === 'vi';
  const isOwnProfile = String(profileId || '') === String(user?.id || user?._id || '') || profileId === 'me';
  const dashboardPath = user?.role === 'freelancer' ? '/freelancer-dashboard' : '/client-dashboard';
  const dashboardRole = user?.role === 'freelancer' ? 'freelancer' : 'client';

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
    trustCenter: isVietnamese ? (dashboardRole === 'freelancer' ? 'Trung tâm tin cậy' : 'Bảng điều khiển khách hàng') : baseLabels.trustCenter,
    workspaceDesc: isVietnamese ? 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.' : baseLabels.workspaceDesc,
    balanceProtected: isVietnamese ? 'Số dư khả dụng' : baseLabels.balanceProtected,
    balanceDesc: isVietnamese ? 'Dùng chung cho các hợp đồng đang hoạt động của bạn.' : baseLabels.balanceDesc,
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLatestBalance = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/escrow/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        const nextBalance = data.summary?.balance;
        if (!response.ok || nextBalance === undefined || !isMounted) return;
        setAvailableBalance(nextBalance);
        setUser((currentUser) => {
          const nextUser = { ...currentUser, balance: nextBalance };
          localStorage.setItem('fptp_user', JSON.stringify(nextUser));
          return nextUser;
        });
      } catch (error) {
        console.error('Failed to fetch freelancer profile balance:', error);
      }
    };
    fetchLatestBalance();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const seedProfile = location.state?.profileSeed || {};
  const fallbackProfile = useMemo(() => freelancerProfiles.find((item) => `${item.id}` === `${profileId}`), [profileId]);

  const ownFreelancerProfile = user?.settings?.freelancerProfile || {};
  const profile = publicProfile || {
    ...fallbackProfile,
    ...seedProfile,
    fullName: user?.fullName || seedProfile.fullName || fallbackProfile?.fullName || 'Freelancer',
    headline: user?.headline || ownFreelancerProfile.headline || seedProfile.headline || fallbackProfile?.headline || (isVietnamese ? 'Freelancer đang hoạt động trên nền tảng' : 'Active freelancer on the platform'),
    summary: user?.bio || seedProfile.summary || fallbackProfile?.summary || '',
    specialty: ownFreelancerProfile.specialty || seedProfile.specialty || fallbackProfile?.specialty || 'Freelancer',
    skills: ownFreelancerProfile.skills || seedProfile.skills || fallbackProfile?.skills || [],
    hourlyRate: seedProfile.hourlyRate || fallbackProfile?.hourlyRate || (isVietnamese ? 'Theo dự án' : 'Project-based'),
    location: seedProfile.location || fallbackProfile?.location || 'Remote',
    availability: seedProfile.availability || fallbackProfile?.availability || (isVietnamese ? 'Linh hoạt' : 'Flexible'),
    cvDataUrl: ownFreelancerProfile.cvDataUrl || '',
    cvFileName: ownFreelancerProfile.cvFileName || '',
    cvFileType: ownFreelancerProfile.cvFileType || '',
    completionRate: fallbackProfile?.completionRate || '—',
    responseTime: fallbackProfile?.responseTime || '—',
    escrowSuccessRate: fallbackProfile?.escrowSuccessRate || '—',
  };

  useEffect(() => {
    let active = true;
    const resolvedProfileId = isOwnProfile ? user?.id || user?._id : profileId;
    if (!resolvedProfileId) return undefined;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const profileRequest = token
          ? fetch(`${API_BASE_URL}/users/public/freelancer/${resolvedProfileId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null)
          : Promise.resolve(null);
        const [profileResponse, ratingResponse, reviewsResponse, completedJobsResponse] = await Promise.all([
          profileRequest,
          fetch(`${API_BASE_URL}/reviews/summary/${resolvedProfileId}`).catch(() => null),
          fetch(`${API_BASE_URL}/reviews/user/${resolvedProfileId}`).catch(() => null),
          fetch(`${API_BASE_URL}/jobs/completed/${resolvedProfileId}`).catch(() => null),
        ]);

        if (!active) return;

        if (profileResponse?.ok) {
          const profileData = await profileResponse.json().catch(() => ({}));
          setPublicProfile(normalizePublicFreelancerProfile(profileData?.user, {
            ...fallbackProfile,
            ...seedProfile,
          }));
        }

        if (ratingResponse?.ok) {
          const ratingData = await ratingResponse.json().catch(() => ({}));
          setReviewSummary({
            averageRating: Number(ratingData?.averageRating || 0),
            totalReviews: Number(ratingData?.totalReviews || 0),
          });
        }

        if (reviewsResponse?.ok) {
          const reviewsData = await reviewsResponse.json().catch(() => ({}));
          setProfileReviews(Array.isArray(reviewsData?.reviews) ? reviewsData.reviews : []);
        }

        if (completedJobsResponse?.ok) {
          const completedJobsData = await completedJobsResponse.json().catch(() => ({}));
          setCompletedJobs(Array.isArray(completedJobsData?.jobs) ? completedJobsData.jobs : []);
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [API_BASE_URL, isOwnProfile, profileId, user?.id, user?._id]);

  const completedWorkHistory = completedJobs.map((job) => ({
    id: job.id || job._id,
    title: job.title || (isVietnamese ? 'Dự án đã hoàn thành' : 'Completed project'),
    summary: job.category || job.scopeSummary || job.description || '',
    budget: job.budget || '',
  }));

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full gap-4 px-3 py-4 sm:gap-5 sm:px-5 xl:gap-6 xl:px-6">
        <Sidebar
          items={sidebarItems}
          activePage={isOwnProfile ? 'profile' : 'marketplace'}
          onNavigate={(page) => {
            if (page === 'profile') return;
            navigate(dashboardPath, { state: { initialPage: page } });
          }}
          labels={labels}
          balanceValue={formatMoney(availableBalance)}
        />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={isVietnamese ? 'Hồ sơ freelancer' : 'Freelancer Profile'}
            subtitle={isVietnamese ? 'Xem CV, lịch sử hoàn thành dự án và độ tin cậy trước khi thuê' : 'Review CV, completed projects, and trust signals before hiring'}
            onLogout={logout}
            onOpenSettings={() => navigate(dashboardPath, { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate(dashboardPath, { state: { initialPage: 'bank' } })}
            language={language}
            onLanguageChange={handleLanguageChange}
            copy={{ role: user?.role === 'freelancer' ? (isVietnamese ? 'freelancer' : 'freelancer') : (isVietnamese ? 'khách hàng' : 'client'), logout: isVietnamese ? 'Đăng xuất' : 'Logout' }}
            user={user}
          />
          {content}
        </div>
      </div>
    </div>
  );

  if (profileLoading && !profile?.fullName) {
    return dashboardLayout(<SectionCard className="p-6">Loading...</SectionCard>);
  }

  return dashboardLayout(
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(isOwnProfile ? dashboardPath : '/client-dashboard', { state: isOwnProfile ? { initialPage: 'profile' } : { initialPage: 'marketplace' } })}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {isOwnProfile ? (isVietnamese ? 'Quay lại bảng điều khiển' : 'Back to dashboard') : (isVietnamese ? 'Quay lại thị trường nhân sự' : 'Back to talent marketplace')}
      </button>

      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 2xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Freelancer</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                {isVietnamese ? 'Freelancer đã xác minh' : 'Verified freelancer'}
              </span>
            </div>
            <h2 className="mt-5 break-words text-4xl font-bold tracking-tight">{profile.fullName}</h2>
            <p className="mt-3 max-w-3xl text-lg text-white/80">{profile.headline}</p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">{profile.summary || (isVietnamese ? 'Freelancer đang hoạt động trên nền tảng.' : 'Active freelancer on the platform.')}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">{isVietnamese ? 'Mức giá' : 'Hourly rate'}</p>
                <p className="mt-2 text-2xl font-bold">{profile.hourlyRate || '—'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">{isVietnamese ? 'Dự án hoàn thành' : 'Completed jobs'}</p>
                <p className="mt-2 text-2xl font-bold">{completedWorkHistory.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">{isVietnamese ? 'Tỷ lệ hoàn thành' : 'Completion rate'}</p>
                <p className="mt-2 text-2xl font-bold">{profile.completionRate || '—'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">{isVietnamese ? 'Phản hồi' : 'Response time'}</p>
                <p className="mt-2 text-2xl font-bold">{profile.responseTime || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{isVietnamese ? 'Địa điểm' : 'Location'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink"><MapPin className="h-5 w-5 text-pine" />{profile.location || 'Remote'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{isVietnamese ? 'Khả dụng' : 'Availability'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink"><Clock3 className="h-5 w-5 text-pine" />{profile.availability || '—'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{isVietnamese ? 'Đánh giá khách hàng' : 'Client rating'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink"><Star className="h-5 w-5 text-amber-500" />{reviewSummary.averageRating ? `${reviewSummary.averageRating.toFixed(1)} / 5` : '5.0 / 5'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{isVietnamese ? 'Tỷ lệ escrow thành công' : 'Escrow success rate'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink"><Shield className="h-5 w-5 text-pine" />{profile.escrowSuccessRate || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <SectionCard className="p-6">
          <p className="muted">{isVietnamese ? 'Hồ sơ ứng tuyển' : 'Resume'}</p>
          <h3 className="mt-1 text-xl font-bold text-ink">{isVietnamese ? 'CV freelancer' : 'Freelancer CV'}</h3>
          <div className="mt-5">
            <CvPreview profile={profile} language={language} />
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <p className="muted">{isVietnamese ? 'Lịch sử công việc' : 'Work history'}</p>
          <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Dự án đã hoàn thành' : 'Completed projects'}</h3>
          <div className="mt-4 max-h-[720px] space-y-4 overflow-y-auto pr-1">
            {completedWorkHistory.length > 0 ? completedWorkHistory.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink">{job.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{job.summary || '—'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{isVietnamese ? 'Hoàn tất' : 'Done'}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                {isVietnamese ? 'Chưa có dự án hoàn thành để hiển thị.' : 'No completed projects to display yet.'}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-6">
        <p className="muted">{isVietnamese ? 'Đánh giá' : 'Reviews'}</p>
        <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Đánh giá từ khách hàng' : 'Client reviews'}</h3>
        <div className="mt-4 space-y-4">
          {profileReviews.length > 0 ? profileReviews.map((review, index) => (
            <div key={review._id || index} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{review.reviewerName || 'Client'}</p>
                <span className="text-sm font-semibold text-amber-500">{Number(review.rating || 5).toFixed(1)} / 5</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment || review.feedback || '—'}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {isVietnamese ? 'Chưa có đánh giá nào để hiển thị.' : 'No reviews to display yet.'}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default FreelancerProfile;

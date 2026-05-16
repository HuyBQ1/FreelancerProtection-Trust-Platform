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

const labels = {
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
  workspaceDesc: 'Manage hiring, approvals, escrow funding, and disputes from one client command center.',
  balanceProtected: 'Protected budget',
  balanceDesc: 'Reserved across your active supplier contracts.',
};

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

function asArray(value) {
  return Array.isArray(value) ? value : [];
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
    ? 'File Word khÃ´ng thá»ƒ xem trá»±c tiáº¿p trong trang. HÃ£y upload CV dáº¡ng áº£nh hoáº·c PDF Ä‘á»ƒ hiá»‡n preview.'
    : 'Word files cannot be previewed directly here. Upload an image or PDF CV to show a preview.';

  if (!profile?.cvDataUrl) {
    return null;
  }

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

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      {unavailableText}
    </div>
  );
}

function FreelancerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [contacting, setContacting] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [profileReviews, setProfileReviews] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const language = user?.settings?.language || 'en';
  const isOwnProfile = String(profileId || '') === String(user?.id || user?._id || '') || profileId === 'me';
  const dashboardPath = user?.role === 'freelancer' ? '/freelancer-dashboard' : '/client-dashboard';
  const dashboardRole = user?.role === 'freelancer' ? 'freelancer' : 'client';
  const localizedLabels = {
    Dashboard: language === 'vi' ? 'Tổng quan' : labels.Dashboard,
    Jobs: language === 'vi' ? 'Công việc' : labels.Jobs,
    Contracts: language === 'vi' ? 'Hợp đồng' : labels.Contracts,
    Chat: language === 'vi' ? 'Trò chuyện' : labels.Chat,
    'Bank Account': language === 'vi' ? 'Tài khoản ngân hàng' : labels['Bank Account'],
    Payments: language === 'vi' ? 'Thanh toán' : labels.Payments,
    Disputes: language === 'vi' ? 'Tranh chấp' : labels.Disputes,
    workspace: language === 'vi' ? 'Không gian làm việc' : labels.workspace,
    trustCenter: language === 'vi' ? 'Bảng điều khiển khách hàng' : labels.trustCenter,
    workspaceDesc: language === 'vi' ? 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.' : labels.workspaceDesc,
    balanceProtected: language === 'vi' ? 'Số dư khả dụng' : labels.balanceProtected,
    balanceDesc: language === 'vi' ? 'Dùng chung cho các hợp đồng đang hoạt động của bạn.' : labels.balanceDesc,
  };
  Object.assign(localizedLabels, {
    Dashboard: language === 'vi' ? 'Tổng quan' : 'Dashboard',
    Profile: language === 'vi' ? 'Hồ sơ' : 'Profile',
    Jobs: language === 'vi' ? 'Công việc' : 'Jobs',
    Contracts: language === 'vi' ? 'Hợp đồng' : 'Contracts',
    Chat: language === 'vi' ? 'Trò chuyện' : 'Chat',
    'Bank Account': language === 'vi' ? 'Tài khoản ngân hàng' : 'Bank Account',
    Payments: language === 'vi' ? 'Thanh toán' : 'Payments',
    Disputes: language === 'vi' ? 'Tranh chấp' : 'Disputes',
    workspace: language === 'vi' ? 'Không gian làm việc' : 'Workspace',
    trustCenter: language === 'vi' ? (dashboardRole === 'freelancer' ? 'Trung tâm tin cậy' : 'Bảng điều khiển khách hàng') : labels.trustCenter,
    workspaceDesc: language === 'vi'
      ? (dashboardRole === 'freelancer'
        ? 'Quản lý công việc, hợp đồng, thanh toán và tranh chấp trong một nơi.'
        : 'Quản lý tuyển dụng, phê duyệt, thanh toán và tranh chấp trong một trung tâm điều hành.')
      : labels.workspaceDesc,
    balanceProtected: language === 'vi' ? 'Số dư khả dụng' : labels.balanceProtected,
    balanceDesc: language === 'vi' ? 'Dùng chung cho các hợp đồng đang hoạt động của bạn.' : labels.balanceDesc,
  });

  const profile = useMemo(
    () => freelancerProfiles.find((item) => item.id === profileId),
    [profileId],
  );
  const seededProfile = publicProfile || location.state?.profileSeed || (isOwnProfile ? {
    id: user?.id || user?._id || '',
    fullName: user?.fullName || user?.email || '',
    email: user?.email || '',
    headline: user?.settings?.freelancerProfile?.headline || '',
    rating: user?.rating || '0.0',
    totalReviews: user?.ratingCount || 0,
    settings: user?.settings || {},
  } : null);
  let fallbackProfile;

  if (!fallbackProfile) {
    fallbackProfile = {
      id: profileId || 'me',
      fullName: user?.fullName || user?.email || 'Freelancer',
      email: '',
      headline: language === 'vi' ? 'Freelancer Ä‘ang hoáº¡t Ä‘á»™ng trÃªn ná»n táº£ng' : 'Active freelancer on the platform',
      intro: '',
      specialty: 'Freelancer',
      trustBadges: [],
      hourlyRate: language === 'vi' ? 'Theo dá»± Ã¡n' : 'Project-based',
      completedJobs: 0,
      completionRate: '-',
      responseTime: '-',
      location: 'Remote',
      availability: language === 'vi' ? 'Linh hoạt' : 'Flexible',
      rating: '0.0',
      escrowSuccessRate: '-',
      portfolio: [],
      experience: [],
      skills: [],
      reviews: [],
      highlights: [],
    };
  }

  fallbackProfile = {
    ...fallbackProfile,
    trustBadges: asArray(fallbackProfile.trustBadges),
    portfolio: asArray(fallbackProfile.portfolio),
    experience: asArray(fallbackProfile.experience),
    skills: asArray(fallbackProfile.skills),
    reviews: asArray(fallbackProfile.reviews),
    highlights: asArray(fallbackProfile.highlights),
  };
  fallbackProfile = profile || (seededProfile ? {
    id: seededProfile.id,
    fullName: seededProfile.fullName,
    email: seededProfile.email || '',
    headline: seededProfile.headline || (language === 'vi' ? 'Freelancer Ä‘ang hoáº¡t Ä‘á»™ng trÃªn ná»n táº£ng' : 'Active freelancer on the platform'),
    intro: seededProfile.headline || '',
    specialty: language === 'vi' ? 'Freelancer' : 'Freelancer',
    trustBadges: [],
    hourlyRate: '',
    completedJobs: seededProfile.totalReviews || 0,
    completionRate: '—',
    responseTime: '—',
    location: 'Remote',
    availability: language === 'vi' ? 'Linh hoạt' : 'Flexible',
    rating: seededProfile.rating || '0.0',
    escrowSuccessRate: '—',
    portfolio: [],
    experience: [],
    skills: asArray(seededProfile.settings?.freelancerProfile?.skills),
    cvFileName: seededProfile.settings?.freelancerProfile?.cvFileName || '',
    cvFileType: seededProfile.settings?.freelancerProfile?.cvFileType || '',
    cvDataUrl: seededProfile.settings?.freelancerProfile?.cvDataUrl || '',
    reviews: [],
    highlights: [],
  } : null);

  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!profileId) {
        return;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        setProfileLoading(true);
        const targetProfileId = profileId === 'me' ? (user?.id || user?._id || '') : profileId;
        const profileUrl = isOwnProfile
          ? `${API_BASE_URL}/users/profile`
          : `${API_BASE_URL}/users/public/freelancer/${targetProfileId}`;
        const response = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json().catch(() => ({}));
        const profileData = data?.user;
        if (profileData) {
          let cvData = {};
          const resolvedProfileId = profileData.id || targetProfileId;
          try {
            const cvResponse = await fetch(`${API_BASE_URL}/users/cv/freelancer/${resolvedProfileId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (cvResponse.ok) {
              cvData = await cvResponse.json().catch(() => ({}));
            }
          } catch {
            // CV may not exist yet.
          }
          setPublicProfile({
            id: profileData.id || profileId,
            fullName: profileData.fullName || profileData.email || '',
            email: profileData.email || '',
            headline: profileData.headline || profileData.settings?.freelancerProfile?.headline || '',
            rating: profileData.rating || '0.0',
            totalReviews: profileData.ratingCount || 0,
            settings: {
              ...(profileData.settings || {}),
              freelancerProfile: {
                ...(profileData.settings?.freelancerProfile || {}),
                cvFileName: cvData.cvFileName || profileData.settings?.freelancerProfile?.cvFileName || '',
                cvFileType: cvData.cvFileType || profileData.settings?.freelancerProfile?.cvFileType || '',
                cvDataUrl: cvData.cvDataUrl || profileData.settings?.freelancerProfile?.cvDataUrl || '',
              },
            },
          });
        }
      } catch (error) {
        console.error('Failed to load freelancer public profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadPublicProfile();
  }, [profileId, isOwnProfile, user?.id, user?._id]);

  useEffect(() => {
    const loadReviewData = async () => {
      if (!profileId) return;
      try {
        const [ratingResponse, reviewsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/reviews/rating/${profileId}`),
          fetch(`${API_BASE_URL}/reviews/user/${profileId}`),
        ]);

        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          setReviewSummary({
            averageRating: ratingData.averageRating || 0,
            totalReviews: ratingData.totalReviews || 0,
          });
        }

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setProfileReviews(reviewsData.reviews || []);
        }
      } catch (error) {
        console.error('Failed to load freelancer reviews:', error);
      }
    };

    loadReviewData();
  }, [profileId]);

  useEffect(() => {
    const loadCompletedJobs = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const targetProfileId = profileId === 'me' ? (user?.id || user?._id || '') : profileId;
        const urls = isOwnProfile
          ? [`${API_BASE_URL}/jobs/assigned`, `${API_BASE_URL}/jobs/completed`]
          : [`${API_BASE_URL}/jobs/completed/${targetProfileId}`];

        const responses = await Promise.all(urls.map((url) => fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null)));

        const allJobs = [];
        for (const response of responses) {
          if (response?.ok) {
            const data = await response.json().catch(() => ({}));
            if (Array.isArray(data.jobs)) allJobs.push(...data.jobs);
          }
        }

        const uniqueJobs = Array.from(new Map(allJobs.map((job) => [job.id, job])).values());
        const completed = uniqueJobs.filter((job) => {
          const contractState = job.contractState || {};
          const milestones = Array.isArray(contractState.milestones) ? contractState.milestones : [];
          return job.status === 'closed'
            || contractState.status === 'Completed'
            || Number(contractState.progress || 0) >= 100
            || (milestones.length > 0 && milestones.every((milestone) => milestone.status === 'Approved'));
        });

        setCompletedJobs(completed);
      } catch (error) {
        console.error('Failed to load completed jobs:', error);
      }
    };

    loadCompletedJobs();
  }, [isOwnProfile, profileId, user?.id, user?._id]);
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

  const handleContactFreelancer = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/login');
      return;
    }

    setContacting(true);
    setContactStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/chat/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          counterpartyId: fallbackProfile.id,
          counterpartyRole: 'freelancer',
          contract: `${fallbackProfile.fullName} profile discussion`,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Could not start the conversation.');
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
        message: error instanceof Error ? error.message : 'Could not start the conversation.',
      });
    } finally {
      setContacting(false);
    }
  };

  const completedWorkHistory = completedJobs.map((job) => ({
    id: job.id,
    title: job.title || (language === 'vi' ? 'Dự án đã hoàn thành' : 'Completed project'),
    summary: job.category || job.scopeSummary || job.description || '',
    budget: job.budget || '',
  }));
  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar
          items={sidebarItems}
          activePage={isOwnProfile ? 'profile' : 'marketplace'}
          onNavigate={(page) => {
            if (page === 'profile') return;
            navigate(dashboardPath, { state: { initialPage: page } });
          }}
          labels={localizedLabels}
        />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={language === 'vi' ? 'Hồ sơ freelancer' : 'Freelancer Profile'}
            subtitle={language === 'vi' ? 'Xem CV, lịch sử hoàn thành dự án và độ tin cậy trước khi thuê' : 'Review CV, completed projects, and trust signals before hiring'}
            onLogout={logout}
            onOpenSettings={() => navigate(dashboardPath, { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate(dashboardPath, { state: { initialPage: 'bank' } })}
            language={language}
            onLanguageChange={handleLanguageChange}
            copy={{ role: language === 'vi' ? 'khách hàng' : 'client', logout: language === 'vi' ? 'Đăng xuất' : 'Logout' }}
            user={user}
          />
          {content}
        </div>
      </div>
    </div>
  );
  if (!fallbackProfile && profileLoading) {
    return dashboardLayout(
      <SectionCard className="p-8">
        <p className="muted">{language === 'vi' ? '\u0110ang t\u1ea3i h\u1ed3 s\u01a1' : 'Loading profile'}</p>
        <h2 className="mt-2 text-2xl font-bold text-ink">{language === 'vi' ? 'Vui l\u00f2ng ch\u1edd trong gi\u00e2y l\u00e1t' : 'Please wait a moment'}</h2>
      </SectionCard>,
    );
  }

  if (!fallbackProfile) {
    return dashboardLayout(
      <SectionCard className="p-8">
        <p className="muted">Profile not found</p>
        <h2 className="mt-2 text-2xl font-bold text-ink">This freelancer profile is unavailable</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          The profile you tried to open does not exist in the current database records. You can head back to the talent marketplace and choose another freelancer.
        </p>
        <button
          type="button"
          onClick={() => navigate('/client-dashboard', { state: { initialPage: 'marketplace' } })}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </button>
      </SectionCard>,
    );
  }

  return dashboardLayout(
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(dashboardPath, { state: { initialPage: dashboardRole === 'freelancer' ? 'dashboard' : 'marketplace' } })}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {isOwnProfile ? (language === 'vi' ? 'Quay lại bảng điều khiển' : 'Back to dashboard') : 'Back to talent marketplace'}
      </button>

      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {fallbackProfile.specialty}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Verified freelancer
              </span>
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-tight">{fallbackProfile.fullName}</h2>
            <p className="mt-3 max-w-3xl text-lg text-white/80">{fallbackProfile.headline}</p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">{fallbackProfile.intro}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {fallbackProfile.trustBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Hourly rate</p>
                <p className="mt-2 text-2xl font-bold">{fallbackProfile.hourlyRate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Completed jobs</p>
                <p className="mt-2 text-2xl font-bold">{fallbackProfile.completedJobs}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Completion rate</p>
                <p className="mt-2 text-2xl font-bold">{fallbackProfile.completionRate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Response time</p>
                <p className="mt-2 text-2xl font-bold">{fallbackProfile.responseTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <MapPin className="h-5 w-5 text-pine" />
                  {fallbackProfile.location}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Availability</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Clock3 className="h-5 w-5 text-pine" />
                  {fallbackProfile.availability}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Client rating</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Star className="h-5 w-5 fill-gold text-gold" />
                  {Number(reviewSummary.averageRating || fallbackProfile.rating || 0).toFixed(1)} / 5
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Escrow success rate</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Shield className="h-5 w-5 text-pine" />
                  {fallbackProfile.escrowSuccessRate}
                </p>
              </div>
            </div>

            {!isOwnProfile ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleContactFreelancer}
                  disabled={contacting}
                  className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {contacting ? (language === 'vi' ? 'Đang mở trò chuyện...' : 'Opening chat...') : (language === 'vi' ? 'Liên hệ freelancer' : 'Contact freelancer')}
                </button>
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  {language === 'vi' ? 'Mời vào công việc' : 'Invite to job'}
                </button>
              </div>
            ) : null}
            {contactStatus.message ? (
              <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${contactStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {contactStatus.message}
              </p>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        {fallbackProfile.cvDataUrl ? (
          <SectionCard className="flex min-h-[690px] flex-col p-6">
            <p className="muted">{language === 'vi' ? 'Hồ sơ ứng tuyển' : 'Resume'}</p>
            <h3 className="mt-1 text-xl font-bold text-ink">{language === 'vi' ? 'CV freelancer' : 'Freelancer CV'}</h3>
            <div className="mt-5 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <CvPreview profile={fallbackProfile} language={language} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={fallbackProfile.cvDataUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">
                {language === 'vi' ? 'Mở CV toàn màn hình' : 'Open full CV'}
              </a>
              <a href={fallbackProfile.cvDataUrl} download={fallbackProfile.cvFileName || 'freelancer-cv'} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {language === 'vi' ? 'Tải CV' : 'Download CV'}
              </a>
            </div>
          </SectionCard>
        ) : null}

        <SectionCard className="flex min-h-[690px] flex-col p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-pine/10 p-3 text-pine">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">{language === 'vi' ? 'Lịch sử công việc' : 'Work history'}</p>
              <h3 className="text-xl font-bold text-ink">{language === 'vi' ? 'Dự án đã hoàn thành' : 'Completed projects'}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {language === 'vi'
                  ? `${completedWorkHistory.length} dự án đã hoàn thành`
                  : `${completedWorkHistory.length} completed projects`}
              </p>
            </div>
          </div>
          <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-2">
            {completedWorkHistory.length ? completedWorkHistory.map((item) => (
              <div key={item.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold leading-snug text-ink">{item.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.summary}</p>
                    <p className="mt-6 text-2xl font-extrabold text-ink">{item.budget}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                    {language === 'vi' ? 'Hoàn tất' : 'Done'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                {language === 'vi' ? 'Chưa có dự án hoàn thành để hiển thị.' : 'No completed projects to display yet.'}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-6">
        <p className="muted">{language === 'vi' ? 'Đánh giá' : 'Reviews'}</p>
        <h3 className="text-xl font-bold text-ink">{language === 'vi' ? 'Đánh giá từ khách hàng' : 'Client reviews'}</h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(profileReviews.length ? profileReviews.map((review) => ({
            client: review.reviewerId?.fullName || 'Anonymous',
            project: review.milestoneId || (language === 'vi' ? '??nh gi? d? ?n' : 'Project review'),
            rating: (((review.rating?.communication || 0) + (review.rating?.quality || 0) + (review.rating?.timeliness || 0) + (review.rating?.professionalism || 0)) / 4).toFixed(1),
            text: review.comment || (language === 'vi' ? 'Kh?ng c? nh?n x?t b? sung.' : 'No additional comment.'),
          })) : fallbackProfile.reviews).map((review) => (
            <div key={`${review.client}-${review.project}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{review.client}</p>
                  <p className="text-sm text-slate-500">{review.project}</p>
                </div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {review.rating}
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>,

  );
}

export default FreelancerProfile;

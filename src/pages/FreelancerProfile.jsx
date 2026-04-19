import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MapPin,
  Shield,
  Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SectionCard from '../components/SectionCard';
import { freelancerProfiles, sidebarItems } from '../data/mockData';

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
  workspaceDesc: 'Manage hiring, approvals, escrow funding, and disputes from one client command center.',
  balanceProtected: 'Protected budget',
  balanceDesc: 'Reserved across your active supplier contracts.',
};

function FreelancerProfile() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const profile = useMemo(
    () => freelancerProfiles.find((item) => item.id === profileId),
    [profileId],
  );

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

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={(page) => navigate('/client-dashboard', { state: { initialPage: page } })} labels={labels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title="Freelancer Profile"
            subtitle="Review capability, delivery history, and trust signals before hiring"
            onLogout={logout}
            onOpenSettings={() => navigate('/client-dashboard', { state: { initialPage: 'settings' } })}
            onOpenBankSettings={() => navigate('/client-dashboard', { state: { initialPage: 'bank' } })}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'client', logout: 'Logout' }}
            user={user}
          />
          {content}
        </div>
      </div>
    </div>
  );

  if (!profile) {
    return dashboardLayout(
      <SectionCard className="p-8">
        <p className="muted">Profile not found</p>
        <h2 className="mt-2 text-2xl font-bold text-ink">This freelancer profile is unavailable</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          The profile you tried to open does not exist in the current demo data. You can head back to the talent marketplace and choose another freelancer.
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
        onClick={() => navigate('/client-dashboard', { state: { initialPage: 'marketplace' } })}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to talent marketplace
      </button>

      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {profile.specialty}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Verified freelancer
              </span>
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-tight">{profile.fullName}</h2>
            <p className="mt-3 max-w-3xl text-lg text-white/80">{profile.headline}</p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">{profile.intro}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {profile.trustBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Hourly rate</p>
                <p className="mt-2 text-2xl font-bold">{profile.hourlyRate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Completed jobs</p>
                <p className="mt-2 text-2xl font-bold">{profile.completedJobs}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Completion rate</p>
                <p className="mt-2 text-2xl font-bold">{profile.completionRate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Response time</p>
                <p className="mt-2 text-2xl font-bold">{profile.responseTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <MapPin className="h-5 w-5 text-pine" />
                  {profile.location}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Availability</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Clock3 className="h-5 w-5 text-pine" />
                  {profile.availability}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Client rating</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Star className="h-5 w-5 fill-gold text-gold" />
                  {profile.rating} / 5
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Escrow success rate</p>
                <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Shield className="h-5 w-5 text-pine" />
                  {profile.escrowSuccessRate}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
                Invite to job
              </button>
              <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                Start protected contract
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pine/10 p-3 text-pine">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Why this freelancer is strong</p>
                <h3 className="text-xl font-bold text-ink">Execution highlights</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {profile.highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gold/10 p-3 text-gold">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Selected work</p>
                <h3 className="text-xl font-bold text-ink">Portfolio and proof of work</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              {profile.portfolio.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="chip">{item.category}</span>
                    <span className="text-sm text-slate-500">{item.tools}</span>
                  </div>
                  <h4 className="mt-4 text-xl font-semibold text-ink">{item.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.summary}</p>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Outcome</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-coral/10 p-3 text-coral">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Career track</p>
                <h3 className="text-xl font-bold text-ink">Relevant experience</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {profile.experience.map((item) => (
                <div key={`${item.role}-${item.company}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-lg font-semibold text-ink">{item.role}</h4>
                    <span className="text-sm text-slate-500">{item.period}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{item.company}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <p className="muted">Skills fit</p>
            <h3 className="text-xl font-bold text-ink">Core capabilities</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <p className="muted">Client proof</p>
            <h3 className="text-xl font-bold text-ink">Reviews and trust signals</h3>
            <div className="mt-6 space-y-4">
              {profile.reviews.map((review) => (
                <div key={`${review.client}-${review.project}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{review.client}</p>
                      <p className="text-sm text-slate-500">{review.project}</p>
                    </div>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                      {review.rating}.0
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>,
  );
}

export default FreelancerProfile;

import { ArrowRight, BriefcaseBusiness, CircleDollarSign, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SectionCard from '../components/SectionCard';

const copy = {
  home: 'Home',
  marketplace: 'Marketplace',
  contracts: 'Contracts',
  login: 'Login',
  register: 'Register',
};

const features = [
  {
    title: 'Escrow protection',
    description: 'Keep every milestone funded safely before work starts, then release payments only after approval.',
    icon: CircleDollarSign,
  },
  {
    title: 'Trust and verification',
    description: 'Create a safer collaboration flow with identity checks, milestone history, and proof of delivery.',
    icon: ShieldCheck,
  },
  {
    title: 'Freelancer and client workflows',
    description: 'Give both sides clear dashboards for jobs, contracts, product review, disputes, and payouts.',
    icon: Users,
  },
];

const highlights = [
  'Protected milestone funding',
  'Role-based dashboards',
  'Product review before payout',
  'Dispute handling with evidence trail',
];

function Landing() {
  const navigate = useNavigate();

  const handleNavigate = (target) => {
    if (target === 'login' || target === 'register') {
      navigate('/login');
      return;
    }

    if (target === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.getElementById(target);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f3f6fb)]" />
        <div className="relative mx-auto max-w-[1680px] px-4 pb-10 sm:px-6 xl:px-8">
          <Navbar onNavigate={handleNavigate} copy={copy} language="en" onLanguageChange={() => {}} />

          <section className="grid gap-8 pb-8 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                Freelancer Protection & Trust Platform
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-ink sm:text-5xl xl:text-6xl">
                  A secure workspace for hiring, reviewing products, and releasing payments with confidence.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Protect both freelancers and clients with escrow-backed milestones, role-based dashboards, and a cleaner workflow for contracts, approvals, and disputes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleNavigate('contracts')}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Explore Contracts
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid gap-0 sm:grid-cols-[0.95fr_1.05fr]">
                <div className="bg-ink p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Why teams choose it</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight">Built for trust-first freelance collaboration</h2>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    Keep product delivery, milestone approvals, and payment control in one modern workspace instead of scattered chats and invoices.
                  </p>
                </div>
                <div className="space-y-4 bg-white p-6 sm:p-8">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Protected project budget</p>
                    <p className="mt-2 text-3xl font-bold text-ink">$24,600</p>
                    <p className="mt-2 text-sm text-slate-500">Held across active contracts and ready for milestone release.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Pending product reviews</p>
                    <p className="mt-2 text-3xl font-bold text-ink">8</p>
                    <p className="mt-2 text-sm text-slate-500">Clients can review submissions before approving payout.</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </section>

          <section id="marketplace" className="space-y-6 py-8">
            <div>
              <p className="muted">Platform features</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">Core tools for protected freelance work</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {features.map((feature) => (
                <SectionCard key={feature.title} className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </SectionCard>
              ))}
            </div>
          </section>

          <section id="contracts" className="grid gap-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionCard className="p-6 sm:p-8">
              <p className="muted">Client flow</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">Post jobs, review work, and release the right payment</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Clients can add jobs, shortlist freelancers, open contracts, review submitted products, and release escrow milestone payments from one dashboard.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Login as Client
                <ArrowRight className="h-4 w-4" />
              </button>
            </SectionCard>
            <SectionCard className="p-6 sm:p-8">
              <p className="muted">Freelancer flow</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">Track milestones, submit work, and get paid faster</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Freelancers can manage contracts, upload milestone work, respond to product review, and monitor escrow-backed balance and disputes.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Job discovery</p>
                  <p className="mt-2 font-semibold text-ink">Find trustworthy clients and clear scopes</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Product review</p>
                  <p className="mt-2 font-semibold text-ink">Let clients view and approve each product stage</p>
                </div>
              </div>
            </SectionCard>
          </section>

          <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>Freelancer Protection & Trust Platform</p>
              <p>Secure contracts, protected payments, and better collaboration.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Landing;

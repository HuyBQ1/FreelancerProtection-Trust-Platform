import { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/register`;
const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

const roles = [
  {
    value: 'freelancer',
    title: 'Freelancer',
    description: 'Find jobs, submit work, and get paid through milestone escrow.',
    icon: BriefcaseBusiness,
  },
  {
    value: 'client',
    title: 'Client',
    description: 'Post jobs, review products, and release payments with control.',
    icon: Building2,
  },
];

async function registerRequest(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('freelancer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectByRole = (nextRole) => {
    navigate(nextRole === 'client' ? '/client-dashboard' : '/freelancer-dashboard', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Full name, email, and password are required.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerRequest({
        fullName,
        email,
        password,
        role,
        companyName: role === 'client' ? companyName : '',
        headline: role === 'freelancer' ? headline : '',
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-ink p-10 text-white lg:flex lg:flex-col">
          <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Freelancer Protection & Trust Platform
          </span>
          <div className="mt-auto space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">Create your account and choose the right workspace</h1>
            <p className="max-w-lg text-sm leading-7 text-white/70">
              Start as a freelancer to manage jobs and milestone submissions, or join as a client to hire talent and review products securely.
            </p>
            <div className="grid gap-4">
              {roles.map((item) => (
                <div key={item.value} className={`rounded-3xl border p-5 ${role === item.value ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                  <item.icon className="h-6 w-6 text-white" />
                  <p className="mt-4 text-lg font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">Create account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choose your role first, then complete the details to enter the right dashboard.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl bg-slate-100 p-2">
              {roles.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${role === item.value ? 'bg-white shadow-sm' : 'text-slate-600'}`}
                >
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.value}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 characters" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                </div>
              </label>

              {role === 'client' ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Company name</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Studio or company name" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                  </div>
                </label>
              ) : (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Headline</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                    <input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Frontend developer, UI designer..." className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                  </div>
                </label>
              )}

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Creating account...' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

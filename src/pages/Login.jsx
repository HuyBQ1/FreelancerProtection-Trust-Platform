import { useState } from 'react';
import { ArrowLeft, Building2, BriefcaseBusiness, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/login`;
const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

async function loginRequest(email, password) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to the API. Please check that the backend server and database are running.');
    }

    throw error;
  }
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectByRole = (role) => {
    if (role === 'client') {
      navigate('/client-dashboard', { replace: true });
      return;
    }

    if (role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
      return;
    }

    navigate('/freelancer-dashboard', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      const from = location.state?.from?.pathname;

      if (from && (
        (data.user.role === 'client' && from === '/client-dashboard') ||
        (data.user.role === 'freelancer' && from === '/freelancer-dashboard') ||
        (data.user.role === 'admin' && from === '/admin-dashboard')
      )) {
        navigate(from, { replace: true });
        return;
      }

      redirectByRole(data.user.role);
    } catch (submitError) {
      setError(submitError.message);
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
            <h1 className="text-4xl font-bold tracking-tight">Role-based access for clients, freelancers, and admins</h1>
            <p className="max-w-lg text-sm leading-7 text-white/70">
              After login, each account is redirected automatically to the correct workspace for its role.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <Building2 className="h-6 w-6 text-emerald-300" />
                <p className="mt-4 text-lg font-semibold">Client access</p>
                <p className="mt-2 text-sm text-white/70">Manage contracts, approvals, payments, and disputes.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <BriefcaseBusiness className="h-6 w-6 text-sky-300" />
                <p className="mt-4 text-lg font-semibold">Freelancer access</p>
                <p className="mt-2 text-sm text-white/70">Track work, milestones, balance, and recent activity.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <ShieldCheck className="h-6 w-6 text-amber-300" />
                <p className="mt-4 text-lg font-semibold">Admin access</p>
                <p className="mt-2 text-sm text-white/70">Oversee disputes, payouts, users, and protected platform volume.</p>
              </div>
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
            <h2 className="text-3xl font-bold tracking-tight text-ink">Login</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in and we will redirect you to the correct dashboard based on your role.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-ink underline-offset-4 hover:underline">
                Register as Freelancer or Client
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppLanguage } from '../utils/language';

const AUTH_BASE_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth`;
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

async function postAuth(path, payload) {
  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
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
  const [language, setLanguage] = useAppLanguage();
  const isVietnamese = language === 'vi';
  const [role, setRole] = useState('freelancer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [headline, setHeadline] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectByRole = (nextRole) => {
    navigate(nextRole === 'client' ? '/client-dashboard' : '/freelancer-dashboard', { replace: true });
  };

  const validateBaseForm = () => {
    setError('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError(isVietnamese ? 'Họ tên, email và mật khẩu là bắt buộc.' : 'Full name, email, and password are required.');
      return null;
    }

    if (password.trim().length < 6) {
      setError(isVietnamese ? 'Mật khẩu phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters.');
      return null;
    }

    return {
      fullName,
      email,
      password,
      role,
      companyName: role === 'client' ? companyName : '',
      headline: role === 'freelancer' ? headline : '',
    };
  };

  const requestOtp = async () => {
    const payload = validateBaseForm();
    if (!payload) return;

    setLoading(true);

    try {
      const data = await postAuth('/register/request-otp', payload);
      setOtpSent(true);
      setDevMode(Boolean(data.devMode));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (isVietnamese ? 'Gửi OTP thất bại' : 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = validateBaseForm();
    if (!payload) return;

    setLoading(true);

    try {
      if (!otp.trim()) {
        setError(isVietnamese ? 'Vui lòng nhập mã OTP.' : 'Please enter the OTP code.');
        return;
      }

      const data = await postAuth('/register/verify-otp', {
        email,
        otp,
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (isVietnamese ? 'Đăng ký thất bại' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetOtpStep = () => {
    setOtpSent(false);
    setOtp('');
    setDevMode(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-ink p-10 text-white lg:flex lg:flex-col">
          <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {isVietnamese ? 'Nền tảng Bảo vệ & Tin cậy cho Freelancer' : 'Freelancer Protection & Trust Platform'}
          </span>
          <div className="mt-auto space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">
              {isVietnamese ? 'Tạo tài khoản và chọn đúng không gian làm việc' : 'Create your account and choose the right workspace'}
            </h1>
            <p className="max-w-lg text-sm leading-7 text-white/70">
              {isVietnamese
                ? 'Bắt đầu với vai trò freelancer để quản lý công việc và nộp milestone, hoặc tham gia với vai trò khách hàng để tuyển dụng và duyệt sản phẩm một cách an toàn.'
                : 'Start as a freelancer to manage jobs and milestone submissions, or join as a client to hire talent and review products securely.'}
            </p>
            <div className="grid gap-4">
              {roles.map((item) => (
                <div key={item.value} className={`rounded-3xl border p-5 ${role === item.value ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                  <item.icon className="h-6 w-6 text-white" />
                  <p className="mt-4 text-lg font-semibold">{isVietnamese ? (item.value === 'freelancer' ? 'Freelancer' : 'Khách hàng') : item.title}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {isVietnamese
                      ? (item.value === 'freelancer'
                        ? 'Tìm việc, nộp sản phẩm và nhận thanh toán theo từng milestone.'
                        : 'Đăng việc, duyệt sản phẩm và thanh toán với quyền kiểm soát rõ ràng.')
                      : item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {isVietnamese ? 'Về trang chủ' : 'Back to Home'}
              </button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button onClick={() => setLanguage('en')} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${language === 'en' ? 'bg-ink text-white' : 'text-slate-600'}`}>EN</button>
                <button onClick={() => setLanguage('vi')} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${language === 'vi' ? 'bg-ink text-white' : 'text-slate-600'}`}>VI</button>
              </div>
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">{isVietnamese ? 'Tạo tài khoản' : 'Create account'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isVietnamese ? 'Hãy chọn vai trò trước, rồi điền thông tin để vào đúng dashboard.' : 'Choose your role first, then complete the details to enter the right dashboard.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl bg-slate-100 p-2">
              {roles.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${role === item.value ? 'bg-white shadow-sm' : 'text-slate-600'}`}
                >
                  <p className="font-semibold text-ink">{isVietnamese ? (item.value === 'freelancer' ? 'Freelancer' : 'Khách hàng') : item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{isVietnamese ? (item.value === 'freelancer' ? 'Người làm việc tự do' : 'Người thuê dịch vụ') : item.value}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Họ và tên' : 'Full name'}</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={isVietnamese ? 'Nhập họ và tên của bạn' : 'Your full name'} className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="flex gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                  </div>
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={loading}
                    className="shrink-0 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading && !otpSent ? (isVietnamese ? 'Đang gửi...' : 'Sending...') : (isVietnamese ? 'Gửi mã' : 'Send code')}
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Mật khẩu' : 'Password'}</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isVietnamese ? 'Tối thiểu 6 ký tự' : 'Minimum 6 characters'} className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                </div>
              </label>

              {role === 'client' ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tên công ty' : 'Company name'}</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={isVietnamese ? 'Tên studio hoặc công ty' : 'Studio or company name'} className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                  </div>
                </label>
              ) : (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tiêu đề nghề nghiệp' : 'Headline'}</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                    <input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder={isVietnamese ? 'Ví dụ: Frontend developer, UI designer...' : 'Frontend developer, UI designer...'} className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                  </div>
                </label>
              )}

              <div className={`rounded-3xl border p-4 ${otpSent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">OTP</span>
                  <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 ${otpSent ? 'border-emerald-200' : 'border-slate-200'}`}>
                    <Mail className={`h-4 w-4 ${otpSent ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full bg-transparent text-lg font-bold tracking-[0.3em] outline-none placeholder:text-slate-300"
                    />
                  </div>
                </label>
                {otpSent ? (
                  <button type="button" onClick={resetOtpStep} className="mt-3 text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline">
                    {isVietnamese ? 'Đổi email hoặc gửi lại mã' : 'Change email or resend code'}
                  </button>
                ) : null}
              </div>

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading
                  ? (isVietnamese ? 'Đang xác minh...' : 'Verifying...')
                  : (isVietnamese ? 'Đăng ký' : 'Register')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              {isVietnamese ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
              <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
                {isVietnamese ? 'Đăng nhập' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

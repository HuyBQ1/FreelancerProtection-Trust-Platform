import { ArrowRight, BriefcaseBusiness, CircleDollarSign, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SectionCard from '../components/SectionCard';
import { useAppLanguage } from '../utils/language';

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
  const [language, setLanguage] = useAppLanguage();

  const isVietnamese = language === 'vi';
  const copy = {
    home: isVietnamese ? 'Trang chủ' : 'Home',
    marketplace: isVietnamese ? 'Thị trường' : 'Marketplace',
    contracts: isVietnamese ? 'Hợp đồng' : 'Contracts',
    login: isVietnamese ? 'Đăng nhập' : 'Login',
    register: isVietnamese ? 'Đăng ký' : 'Register',
  };

  const localizedFeatures = features.map((feature) => ({
    ...feature,
    title: isVietnamese
      ? (
        feature.title === 'Escrow protection' ? 'Bảo vệ ký quỹ'
          : feature.title === 'Trust and verification' ? 'Tin cậy và xác minh'
            : 'Quy trình cho freelancer và khách hàng'
      )
      : feature.title,
    description: isVietnamese
      ? (
        feature.title === 'Escrow protection'
          ? 'Giữ an toàn ngân sách cho từng mốc công việc trước khi bắt đầu, rồi chỉ giải ngân sau khi được phê duyệt.'
          : feature.title === 'Trust and verification'
            ? 'Tạo quy trình cộng tác an toàn hơn với xác minh danh tính, lịch sử milestone và bằng chứng bàn giao.'
            : 'Cung cấp dashboard rõ ràng cho cả hai bên về công việc, hợp đồng, duyệt sản phẩm, tranh chấp và thanh toán.'
      )
      : feature.description,
  }));

  const localizedHighlights = isVietnamese
    ? [
      'Bảo vệ ngân sách theo từng milestone',
      'Dashboard theo vai trò',
      'Duyệt sản phẩm trước khi thanh toán',
      'Xử lý tranh chấp có lịch sử bằng chứng',
    ]
    : highlights;

  const handleNavigate = (target) => {
    if (target === 'login') {
      navigate('/login');
      return;
    }

    if (target === 'register') {
      navigate('/register');
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
          <Navbar onNavigate={handleNavigate} copy={copy} language={language} onLanguageChange={setLanguage} />

          <section className="grid gap-8 pb-8 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                {isVietnamese ? 'Nền tảng Bảo vệ & Tin cậy cho Freelancer' : 'Freelancer Protection & Trust Platform'}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-ink sm:text-5xl xl:text-6xl">
                  {isVietnamese
                    ? 'Không gian làm việc an toàn để tuyển dụng, duyệt sản phẩm và thanh toán một cách tin cậy.'
                    : 'A secure workspace for hiring, reviewing products, and releasing payments with confidence.'}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  {isVietnamese
                    ? 'Bảo vệ cả freelancer lẫn khách hàng bằng các milestone có ngân sách bảo đảm, dashboard theo vai trò và quy trình rõ ràng hơn cho hợp đồng, phê duyệt và tranh chấp.'
                    : 'Protect both freelancers and clients with escrow-backed milestones, role-based dashboards, and a cleaner workflow for contracts, approvals, and disputes.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isVietnamese ? 'Bắt đầu ngay' : 'Get Started'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleNavigate('contracts')}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {isVietnamese ? 'Khám phá hợp đồng' : 'Explore Contracts'}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {localizedHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid gap-0 sm:grid-cols-[0.95fr_1.05fr]">
                <div className="bg-ink p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{isVietnamese ? 'Vì sao các đội nhóm chọn nền tảng này' : 'Why teams choose it'}</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight">{isVietnamese ? 'Được xây dựng cho cộng tác freelance đặt niềm tin lên trước' : 'Built for trust-first freelance collaboration'}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    {isVietnamese
                      ? 'Giữ việc bàn giao sản phẩm, phê duyệt milestone và kiểm soát thanh toán trong một không gian làm việc hiện đại thay vì rời rạc qua chat và hóa đơn.'
                      : 'Keep product delivery, milestone approvals, and payment control in one modern workspace instead of scattered chats and invoices.'}
                  </p>
                </div>
                <div className="space-y-4 bg-white p-6 sm:p-8">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">{isVietnamese ? 'Ngân sách dự án được bảo vệ' : 'Protected project budget'}</p>
                    <p className="mt-2 text-3xl font-bold text-ink">24,600,000 VND</p>
                    <p className="mt-2 text-sm text-slate-500">{isVietnamese ? 'Được giữ trên các hợp đồng đang hoạt động và sẵn sàng giải ngân theo milestone.' : 'Held across active contracts and ready for milestone release.'}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">{isVietnamese ? 'Sản phẩm đang chờ duyệt' : 'Pending product reviews'}</p>
                    <p className="mt-2 text-3xl font-bold text-ink">8</p>
                    <p className="mt-2 text-sm text-slate-500">{isVietnamese ? 'Khách hàng có thể duyệt bài nộp trước khi chấp thuận thanh toán.' : 'Clients can review submissions before approving payout.'}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </section>

          <section id="marketplace" className="space-y-6 py-8">
            <div>
              <p className="muted">{isVietnamese ? 'Tính năng nền tảng' : 'Platform features'}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">{isVietnamese ? 'Những công cụ cốt lõi cho công việc freelance an toàn' : 'Core tools for protected freelance work'}</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {localizedFeatures.map((feature) => (
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
              <p className="muted">{isVietnamese ? 'Quy trình khách hàng' : 'Client flow'}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">{isVietnamese ? 'Đăng việc, duyệt sản phẩm và thanh toán đúng lúc' : 'Post jobs, review work, and release the right payment'}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {isVietnamese
                  ? 'Khách hàng có thể thêm công việc, chọn freelancer phù hợp, mở hợp đồng, duyệt sản phẩm đã nộp và giải ngân milestone trong cùng một dashboard.'
                  : 'Clients can add jobs, shortlist freelancers, open contracts, review submitted products, and release escrow milestone payments from one dashboard.'}
              </p>
              <button
                onClick={() => navigate('/register')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isVietnamese ? 'Đăng ký với vai trò khách hàng' : 'Register as Client'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </SectionCard>
            <SectionCard className="p-6 sm:p-8">
              <p className="muted">{isVietnamese ? 'Quy trình freelancer' : 'Freelancer flow'}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">{isVietnamese ? 'Theo dõi milestone, nộp sản phẩm và nhận tiền nhanh hơn' : 'Track milestones, submit work, and get paid faster'}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {isVietnamese
                  ? 'Freelancer có thể quản lý hợp đồng, tải lên sản phẩm theo milestone, phản hồi phần duyệt sản phẩm và theo dõi thanh toán cùng tranh chấp.'
                  : 'Freelancers can manage contracts, upload milestone work, respond to product review, and monitor escrow-backed balance and disputes.'}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{isVietnamese ? 'Tìm việc' : 'Job discovery'}</p>
                  <p className="mt-2 font-semibold text-ink">{isVietnamese ? 'Tìm khách hàng đáng tin cậy với phạm vi công việc rõ ràng' : 'Find trustworthy clients and clear scopes'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{isVietnamese ? 'Duyệt sản phẩm' : 'Product review'}</p>
                  <p className="mt-2 font-semibold text-ink">{isVietnamese ? 'Cho khách hàng xem và phê duyệt từng giai đoạn sản phẩm' : 'Let clients view and approve each product stage'}</p>
                </div>
              </div>
            </SectionCard>
          </section>

          <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{isVietnamese ? 'Nền tảng Bảo vệ & Tin cậy cho Freelancer' : 'Freelancer Protection & Trust Platform'}</p>
              <p>{isVietnamese ? 'Hợp đồng an toàn, thanh toán được bảo vệ và cộng tác hiệu quả hơn.' : 'Secure contracts, protected payments, and better collaboration.'}</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Landing;

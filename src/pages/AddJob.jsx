import { ArrowLeft, BriefcaseBusiness, Plus, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sidebarItems } from '../data/appData';
import { persistLanguage } from '../utils/language';
import { formatMoney, parseMoneyAmount } from '../utils/money';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';
const jobCategories = ['Design', 'Development', 'Security', 'Legal'];
const experienceLevels = ['Entry', 'Intermediate', 'Senior', 'Expert'];
const engagementTypes = ['Fixed price', 'Hourly', 'Retainer'];
const locationTypes = ['Remote', 'Hybrid', 'On-site'];
const skillOptions = [
  'React',
  'Vite',
  'Tailwind CSS',
  'JavaScript',
  'Node.js',
  'Express',
  'MongoDB',
  'Mongoose',
  'FastAPI',
  'Socket.IO',
  'UI/UX Design',
  'Dashboard',
  'Payment',
  'KYC',
  'API Integration',
  'Responsive UI',
];
const optionLabels = {
  category: {
    Design: { en: 'Design', vi: 'Thiết kế' },
    Development: { en: 'Development', vi: 'Phát triển' },
    Security: { en: 'Security', vi: 'Bảo mật' },
    Legal: { en: 'Legal', vi: 'Pháp lý' },
  },
  experience: {
    Entry: { en: 'Entry', vi: 'Mới bắt đầu' },
    Intermediate: { en: 'Intermediate', vi: 'Trung cấp' },
    Senior: { en: 'Senior', vi: 'Cao cấp' },
    Expert: { en: 'Expert', vi: 'Chuyên gia' },
  },
  engagement: {
    'Fixed price': { en: 'Fixed price', vi: 'Giá cố định' },
    Hourly: { en: 'Hourly', vi: 'Theo giờ' },
    Retainer: { en: 'Retainer', vi: 'Duy trì' },
  },
  location: {
    Remote: { en: 'Remote', vi: 'Từ xa' },
    Hybrid: { en: 'Hybrid', vi: 'Kết hợp' },
    'On-site': { en: 'On-site', vi: 'Tại chỗ' },
  },
};
const defaultJobForm = {
  title: '',
  category: 'Design',
  budget: '',
  experienceLevel: 'Senior',
  timeline: '',
  locationType: 'Remote',
  engagementType: 'Fixed price',
  scopeSummary: '',
  skills: '',
  description: '',
  milestones: [
    { title: 'Kickoff and scope alignment', amount: '', dueDate: '', description: '' },
    { title: 'Final delivery and approval', amount: '', dueDate: '', description: '' },
  ],
};
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
function sanitizeMoneyInput(value) {
  return `${value || ''}`.replace(/[^0-9]/g, '');
}
function moneyToNumber(value) {
  return parseMoneyAmount(value);
}
function formatMoneyPreview(value, fallback = 'Set amount') {
  const amount = moneyToNumber(value);
  if (amount <= 0) {
    return fallback;
  }
  return formatMoney(amount);
}
function getOptionLabel(group, value, language) {
  return optionLabels[group]?.[value]?.[language] || value;
}
function getTimelineDays(value) {
  const match = `${value || ''}`.match(/\d+/);
  const days = match ? Number.parseInt(match[0], 10) : 14;
  if (!Number.isFinite(days)) {
    return 14;
  }
  return Math.min(90, Math.max(1, days));
}
function formatTimelineDays(days, language) {
  return language === 'vi' ? `${days} ngày` : `${days} days`;
}
function parseSkillList(value) {
  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
function formatSkillList(skills) {
  return [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))].join(', ');
}

function parseCategoryList(value) {
  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCategoryList(categories) {
  return [...new Set(categories.map((item) => item.trim()).filter(Boolean))].join(', ');
}
function getMilestoneDueDays(value) {
  const match = `${value || ''}`.match(/\d+/);
  const days = match ? Number.parseInt(match[0], 10) : 7;
  if (!Number.isFinite(days)) {
    return 7;
  }
  return Math.min(90, Math.max(1, days));
}
function AddJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [jobSaving, setJobSaving] = useState(false);
  const [jobLoading, setJobLoading] = useState(isEditMode);
  const [jobStatus, setJobStatus] = useState({ type: '', message: '' });
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [extendedTimelineDays, setExtendedTimelineDays] = useState('');
  const language = user?.settings?.language || 'en';
  const localizedLabels = {
    Dashboard: language === 'vi' ? 'T\u1ed5ng quan' : labels.Dashboard,
    Jobs: language === 'vi' ? 'C\u00f4ng vi\u1ec7c' : labels.Jobs,
    Contracts: language === 'vi' ? 'H\u1ee3p \u0111\u1ed3ng' : labels.Contracts,
    Chat: language === 'vi' ? 'Tr\u00f2 chuy\u1ec7n' : labels.Chat,
    'Bank Account': language === 'vi' ? 'T\u00e0i kho\u1ea3n ng\u00e2n h\u00e0ng' : labels['Bank Account'],
    Payments: language === 'vi' ? 'Thanh to\u00e1n' : labels.Payments,
    Disputes: language === 'vi' ? 'Tranh ch\u1ea5p' : labels.Disputes,
    workspace: language === 'vi' ? 'Kh\u00f4ng gian l\u00e0m vi\u1ec7c' : labels.workspace,
    trustCenter: language === 'vi' ? 'B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n kh\u00e1ch h\u00e0ng' : labels.trustCenter,
    workspaceDesc: language === 'vi' ? 'Qu\u1ea3n l\u00fd tuy\u1ec3n d\u1ee5ng, ph\u00ea duy\u1ec7t, thanh to\u00e1n v\u00e0 tranh ch\u1ea5p trong m\u1ed9t trung t\u00e2m \u0111i\u1ec1u h\u00e0nh.' : labels.workspaceDesc,
    balanceProtected: language === 'vi' ? 'S\u1ed1 d\u01b0 kh\u1ea3 d\u1ee5ng' : labels.balanceProtected,
    balanceDesc: language === 'vi' ? 'D\u00f9ng chung cho c\u00e1c h\u1ee3p \u0111\u1ed3ng \u0111ang ho\u1ea1t \u0111\u1ed9ng c\u1ee7a b\u1ea1n.' : labels.balanceDesc,
  };
  const quickTips = useMemo(
    () => [
      language === 'vi' ? 'H\u00e3y n\u00eau r\u00f5 s\u1ea3n ph\u1ea9m b\u00e0n giao v\u00e0 ti\u00eau ch\u00ed ph\u00ea duy\u1ec7t.' : 'Be specific about deliverables and approval criteria.',
      language === 'vi' ? 'Li\u1ec7t k\u00ea c\u00f4ng c\u1ee5 ho\u1eb7c stack b\u1ea1n mu\u1ed1n freelancer s\u1eed d\u1ee5ng.' : 'List the tools or stack you expect the freelancer to use.',
      language === 'vi' ? 'N\u00eau r\u00f5 m\u1ed1c th\u1eddi gian v\u00e0 k\u1ef3 v\u1ecdng giao ti\u1ebfp ngay t\u1eeb \u0111\u1ea7u.' : 'Include timeline and communication expectations up front.',
    ],
    [language],
  );
  const previewChips = useMemo(
    () => [
      getOptionLabel('experience', jobForm.experienceLevel || 'Senior', language),
      getOptionLabel('engagement', jobForm.engagementType || 'Fixed price', language),
      getOptionLabel('location', jobForm.locationType || 'Remote', language),
      jobForm.timeline || (language === 'vi' ? 'Th\u1eddi gian linh ho\u1ea1t' : 'Flexible timeline'),
    ],
    [jobForm.engagementType, jobForm.experienceLevel, jobForm.locationType, jobForm.timeline, language],
  );
  const budgetAmount = useMemo(() => moneyToNumber(jobForm.budget), [jobForm.budget]);
  const timelineDays = useMemo(() => getTimelineDays(jobForm.timeline), [jobForm.timeline]);
  const timelineRawDays = useMemo(() => {
    const match = `${jobForm.timeline || ''}`.match(/\d+/);
    const days = match ? Number.parseInt(match[0], 10) : 0;
    return Number.isFinite(days) ? days : 0;
  }, [jobForm.timeline]);
  const selectedSkills = useMemo(() => parseSkillList(jobForm.skills), [jobForm.skills]);
  const selectedCategories = useMemo(() => parseCategoryList(jobForm.category), [jobForm.category]);
  const milestoneTotal = useMemo(
    () => jobForm.milestones.reduce((sum, milestone) => sum + moneyToNumber(milestone.amount), 0),
    [jobForm.milestones],
  );
  const budgetDifference = budgetAmount - milestoneTotal;
  const milestoneTotalMatchesBudget = budgetAmount > 0 && Math.abs(budgetDifference) <= 0.01;
  const updateJobField = (field, value) => {
    setJobForm((current) => ({ ...current, [field]: value }));
  };
  const toggleSkill = (skill) => {
    const normalizedSkill = skill.trim();
    const exists = selectedSkills.some((item) => item.toLowerCase() === normalizedSkill.toLowerCase());
    const nextSkills = exists
      ? selectedSkills.filter((item) => item.toLowerCase() !== normalizedSkill.toLowerCase())
      : [...selectedSkills, normalizedSkill];
    updateJobField('skills', formatSkillList(nextSkills));
  };

  const toggleCategory = (category) => {
    const normalizedCategory = category.trim();
    const exists = selectedCategories.some((item) => item.toLowerCase() === normalizedCategory.toLowerCase());
    const nextCategories = exists
      ? selectedCategories.filter((item) => item.toLowerCase() !== normalizedCategory.toLowerCase())
      : [...selectedCategories, normalizedCategory];

    updateJobField('category', formatCategoryList(nextCategories));
  };

  const applyExtendedTimeline = () => {
    const days = Number.parseInt(extendedTimelineDays, 10);
    if (!Number.isFinite(days) || days <= 90) {
      setJobStatus({ type: 'error', message: 'Vui lòng nhập số ngày lớn hơn 90.' });
      return;
    }
    updateJobField('timeline', formatTimelineDays(days, 'en'));
    setJobStatus({ type: '', message: '' });
  };
  const resetForm = () => {
    setJobForm(defaultJobForm);
  };
  useEffect(() => {
    if (!isEditMode) {
      setJobLoading(false);
      return;
    }
    const fetchJobForEdit = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      setJobLoading(true);
      setJobStatus({ type: '', message: '' });
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Could not load this job post.');
        }
        const job = data.job || {};
        setJobForm({
          title: job.title || '',
          category: job.category || 'Design',
          budget: moneyToNumber(job.budget) > 0 ? `${moneyToNumber(job.budget)}` : '',
          experienceLevel: job.experienceLevel || 'Senior',
          timeline: job.timeline || '',
          locationType: job.locationType || 'Remote',
          engagementType: job.engagementType || 'Fixed price',
          scopeSummary: job.scopeSummary || '',
          skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
          description: job.description || '',
          milestones: Array.isArray(job.milestones) && job.milestones.length > 0
            ? job.milestones.map((milestone) => ({
              title: milestone.title || '',
              amount: moneyToNumber(milestone.amount) > 0 ? `${moneyToNumber(milestone.amount)}` : '',
              dueDate: milestone.dueDate || '',
              description: milestone.description || '',
            }))
            : defaultJobForm.milestones,
        });
      } catch (error) {
        setJobStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Could not load this job post.',
        });
      } finally {
        setJobLoading(false);
      }
    };
    fetchJobForEdit();
  }, [isEditMode, jobId, navigate]);
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
  const logout = () => {
    localStorage.removeItem('fptp_token');
    localStorage.removeItem('fptp_user');
    navigate('/login', { replace: true });
  };
  const routeToClientDashboard = (page) => {
    navigate('/client-dashboard', { state: { initialPage: page } });
  };
  const handleCreateJob = async (event) => {
    event.preventDefault();
    setJobStatus({ type: '', message: '' });
    if (!jobForm.title.trim() || !jobForm.description.trim() || !jobForm.category.trim() || !jobForm.budget.trim()) {
      setJobStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập đủ tiêu đề, danh mục, ngân sách và mô tả.' : 'Please complete title, category, budget, and description.' });
      return;
    }
    const parsedBudget = moneyToNumber(jobForm.budget);
    if (parsedBudget <= 0) {
      setJobStatus({ type: 'error', message: language === 'vi' ? 'Ngân sách phải là số lớn hơn 0.' : 'Budget must be a number greater than 0.' });
      return;
    }
    const normalizedMilestone = jobForm.milestones
      .map((milestone) => ({
        title: milestone.title.trim(),
        amount: sanitizeMoneyInput(milestone.amount),
        dueDate: milestone.dueDate.trim(),
        description: milestone.description.trim(),
      }))
      .filter((milestone) => milestone.title && milestone.amount);
    if (normalizedMilestone.length === 0) {
      setJobStatus({ type: 'error', message: language === 'vi' ? 'Vui lòng thêm ít nhất một milestone có tiêu đề và số tiền.' : 'Please add at least one milestone with a title and payment amount.' });
      return;
    }
    if (normalizedMilestone.some((milestone) => moneyToNumber(milestone.amount) <= 0)) {
      setJobStatus({ type: 'error', message: language === 'vi' ? 'Mỗi số tiền milestone phải lớn hơn 0.' : 'Every milestone amount must be a number greater than 0.' });
      return;
    }
    const normalizedMilestoneTotal = normalizedMilestone.reduce((sum, milestone) => sum + moneyToNumber(milestone.amount), 0);
    if (Math.abs(normalizedMilestoneTotal - parsedBudget) > 0.01) {
      setJobStatus({ type: 'error', message: language === 'vi' ? 'Tổng milestone phải bằng ngân sách trước khi đăng.' : 'Milestone total must equal the job budget before posting.' });
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    setJobSaving(true);
    try {
      const res = await fetch(isEditMode ? `${API_BASE_URL}/jobs/${jobId}` : `${API_BASE_URL}/jobs`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...jobForm,
          budget: `${parsedBudget}`,
          skills: parseSkillList(jobForm.skills),
          milestones: normalizedMilestone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Could not create job.');
      }
      if (!isEditMode) {
        resetForm();
      }
      navigate('/client-dashboard', {
        state: {
          initialPage: 'marketplace',
          jobStatus: {
            type: 'success',
            message: isEditMode
              ? (language === 'vi' ? 'Cập nhật bài đăng thành công.' : 'Job post updated successfully.')
              : (language === 'vi' ? 'Tạo công việc thành công.' : 'Job created successfully.'),
          },
        },
      });
    } catch (error) {
      setJobStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not create job.',
      });
    } finally {
      setJobSaving(false);
    }
  };
  const updateMilestoneField = (index, field, value) => {
    const nextValue = field === 'amount' ? sanitizeMoneyInput(value) : value;
    setJobForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) => (
        milestoneIndex === index ? { ...milestone, [field]: nextValue } : milestone
      )),
    }));
  };
  const addMilestone = () => {
    setJobForm((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        { title: '', amount: '', dueDate: '', description: '' },
      ],
    }));
  };
  const removeMilestone = (index) => {
    setJobForm((current) => ({
      ...current,
      milestones: current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index),
    }));
  };
  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="flex w-full gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage="marketplace" onNavigate={routeToClientDashboard} labels={localizedLabels} />
        <div className="min-w-0 flex-1 space-y-6">
            <Topbar
              title={user?.settings?.language === 'vi' ? (isEditMode ? 'Chỉnh sửa công việc' : 'Thêm công việc') : (isEditMode ? 'Edit Job' : 'Add Job')}
              subtitle={user?.settings?.language === 'vi' ? (isEditMode ? 'Cập nhật bản mô tả tuyển dụng sau quá trình trao đổi' : 'Tạo bản mô tả tuyển dụng riêng cho không gian khách hàng của bạn') : (isEditMode ? 'Update your hiring brief after negotiation' : 'Create a dedicated hiring brief for your client workspace')}
            onLogout={logout}
            onOpenSettings={() => routeToClientDashboard('settings')}
            onOpenBankSettings={() => routeToClientDashboard('bank')}
            language={user?.settings?.language || 'en'}
            onLanguageChange={handleLanguageChange}
              copy={{ role: user?.settings?.language === 'vi' ? 'khách hàng' : 'client', logout: user?.settings?.language === 'vi' ? 'Đăng xuất' : 'Logout' }}
            user={user}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => routeToClientDashboard('marketplace')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'vi' ? 'Quay lại công việc' : 'Back to Jobs'}
            </button>
          </div>
          <SectionCard className="overflow-hidden p-0">
            <div className="grid gap-0">
              <div className="relative overflow-hidden bg-ink p-6 text-white sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.18),transparent_34%)]" />
                <div className="relative">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {language === 'vi' ? (isEditMode ? 'Chỉnh sửa mô tả tuyển dụng' : 'Mô tả tuyển dụng khách hàng') : (isEditMode ? 'Client brief editor' : 'Client hiring brief')}
                  </span>
                  <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight">
                    {language === 'vi' ? (isEditMode ? 'Chỉnh sửa bài đăng việc làm sau khi trao đổi' : 'Tạo bài đăng công việc đầy đủ hơn cho freelancer') : (isEditMode ? 'Edit your job post after the deal discussion' : 'Create a richer job post for freelancers')}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
                    {language === 'vi' ? 'Biến một yêu cầu sơ sài thành bản mô tả chuyên nghiệp với ngân sách, phạm vi, kỹ năng và kỳ vọng bàn giao mà freelancer giỏi có thể tin tưởng.' : 'Turn a vague request into a serious brief with budget, scope, skills, and delivery expectations that good freelancers can trust.'}
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">{language === 'vi' ? 'Rõ ràng' : 'Clarity'}</p>
                      <p className="mt-2 text-lg font-semibold">{language === 'vi' ? 'Phạm vi dễ báo giá' : 'Scope that is easy to price'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">{language === 'vi' ? 'Tin cậy' : 'Trust'}</p>
                      <p className="mt-2 text-lg font-semibold">{language === 'vi' ? 'Kỳ vọng rõ để giảm làm lại' : 'Expectations that reduce rework'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">{language === 'vi' ? 'Chất lượng' : 'Quality'}</p>
                      <p className="mt-2 text-lg font-semibold">{language === 'vi' ? 'Đề xuất tốt hơn từ người phù hợp hơn' : 'Better proposals from better people'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="muted">{language === 'vi' ? 'Hướng dẫn nhanh' : 'Quick guide'}</p>
                    <h2 className="text-2xl font-bold text-ink">{language === 'vi' ? 'Một bản mô tả tốt nên có gì' : 'What strong briefs include'}</h2>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {quickTips.map((tip) => (
                    <div key={tip} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
          <div>
            <SectionCard className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="muted">Bài đăng mới</p>
                  <h2 className="text-2xl font-bold text-ink">Chi tiết công việc</h2>
                </div>
              </div>
              {jobLoading ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                  {language === 'vi' ? 'Đang tải bài đăng từ cơ sở dữ liệu...' : 'Đang tải bài đăng từ cơ sở dữ liệu...'}
                </div>
              ) : (
              <form onSubmit={handleCreateJob} className="mt-8 space-y-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Thông tin cốt lõi</p>
                  </div>
                  <div className="grid items-start gap-3 xl:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Tiêu đề công việc</span>
                      <input value={jobForm.title} onChange={(event) => updateJobField('title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Kỹ sư React senior cho dashboard thanh toán" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Danh mục</span>
                      <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {jobCategories.map((category) => {
                            const isChecked = selectedCategories.includes(category);
                            return (
                              <label
                                key={category}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                                  isChecked
                                    ? 'border-pine bg-pine/10 text-pine'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCategory(category)}
                                  className="h-3 w-3 rounded border-slate-300 text-pine focus:ring-pine"
                                />
                                <span>{getOptionLabel('category', category, 'en')}</span>
                              </label>
                            );
                          })}
                        </div>
                        <input
                          value={jobForm.category}
                          onChange={(event) => updateJobField('category', formatCategoryList(parseCategoryList(event.target.value)))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                          placeholder="Có thể nhập thêm, cách nhau bằng dấu phẩy"
                        />
                      </div>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Ngân sách và độ phù hợp</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Ngân sách</span>
                      <input
                        value={jobForm.budget}
                        onChange={(event) => updateJobField('budget', sanitizeMoneyInput(event.target.value))}
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                        placeholder="6000000"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Mức kinh nghiệm</span>
                      <select value={jobForm.experienceLevel} onChange={(event) => updateJobField('experienceLevel', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {experienceLevels.map((level) => (
                          <option key={level} value={level}>{getOptionLabel('experience', level, 'en')}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Hình thức hợp tác</span>
                      <select value={jobForm.engagementType} onChange={(event) => updateJobField('engagementType', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {engagementTypes.map((type) => (
                          <option key={type} value={type}>{getOptionLabel('engagement', type, 'en')}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Địa điểm</span>
                      <select value={jobForm.locationType} onChange={(event) => updateJobField('locationType', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400">
                        {locationTypes.map((type) => (
                          <option key={type} value={type}>{getOptionLabel('location', type, 'en')}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Phạm vi và bàn giao</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">Thời gian thực hiện</span>
                        <span className="rounded-full bg-pine/10 px-3 py-1 text-sm font-bold text-pine">
                          {formatTimelineDays(timelineDays, 'en')}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                        <input
                          type="range"
                          min="1"
                          max="90"
                          step="1"
                          value={timelineDays}
                          onChange={(event) => updateJobField('timeline', formatTimelineDays(Number.parseInt(event.target.value, 10), 'en'))}
                          className="h-2 w-full cursor-pointer accent-pine"
                        />
                        <div className="mt-1.5 flex justify-between text-xs font-semibold text-slate-400">
                          <span>1 day</span>
                          <span>90 days</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min="91"
                            value={extendedTimelineDays}
                            onChange={(event) => setExtendedTimelineDays(event.target.value)}
                            placeholder="> 90 ngày"
                            className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-pine"
                          />
                          <button
                            type="button"
                            onClick={applyExtendedTimeline}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Áp dụng
                          </button>
                          {timelineRawDays > 90 ? (
                            <span className="text-xs font-semibold text-pine">{timelineRawDays} days</span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Kỹ năng yêu cầu</span>
                      <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {skillOptions.map((skill) => {
                            const isChecked = selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
                            return (
                              <label
                                key={skill}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                                  isChecked
                                    ? 'border-pine bg-pine/10 text-pine'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSkill(skill)}
                                  className="h-3 w-3 rounded border-slate-300 text-pine focus:ring-pine"
                                />
                                <span>{skill}</span>
                              </label>
                            );
                          })}
                        </div>
                        <input
                          value={jobForm.skills}
                          onChange={(event) => updateJobField('skills', formatSkillList(parseSkillList(event.target.value)))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                          placeholder="Thêm kỹ năng khác, cách nhau bằng dấu phẩy"
                        />
                      </div>
                    </label>
                  </div>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Tóm tắt phạm vi</span>
                    <input value={jobForm.scopeSummary} onChange={(event) => updateJobField('scopeSummary', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Xây cổng khách hàng an toàn với duyệt milestone và kiểm soát thanh toán." />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Mô tả chi tiết</span>
                    <textarea value={jobForm.description} onChange={(event) => updateJobField('description', event.target.value)} rows={7} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400" placeholder="Mô tả vai trò, phạm vi, sản phẩm bàn giao và kiểu freelancer bạn muốn tuyển." />
                  </label>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Milestone</p>
                      <p className="mt-1 text-sm text-slate-500">Thiết lập từng giai đoạn thanh toán để freelancer biết rõ cách bàn giao và phê duyệt.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm milestone
                    </button>
                  </div>
                  <div className="space-y-4">
                    {jobForm.milestones.map((milestone, index) => (
                      <div key={`milestone-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{`Milestone ${index + 1}`}</p>
                          {jobForm.milestones.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeMilestone(index)}
                              className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                            >
                              Xóa
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Tên milestone</span>
                            <input
                              value={milestone.title}
                              onChange={(event) => updateMilestoneField(index, 'title', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="Khảo sát và phác thảo giao diện"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Số tiền thanh toán</span>
                            <input
                              value={milestone.amount}
                              onChange={(event) => updateMilestoneField(index, 'amount', event.target.value)}
                              inputMode="numeric"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="1200000"
                            />
                          </label>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-slate-700">Thời hạn hoàn thành</span>
                              <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-sm font-bold text-pine">
                                {formatTimelineDays(getMilestoneDueDays(milestone.dueDate), 'en')}
                              </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                              <input
                                type="range"
                                min="1"
                                max="90"
                                step="1"
                                value={getMilestoneDueDays(milestone.dueDate)}
                                onChange={(event) => updateMilestoneField(index, 'dueDate', formatTimelineDays(Number.parseInt(event.target.value, 10), 'en'))}
                                className="h-1.5 w-full cursor-pointer accent-pine"
                              />
                              <div className="mt-1.5 flex justify-between text-xs font-semibold text-slate-400">
                                <span>1 day</span>
                                <span>90 days</span>
                              </div>
                            </div>
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Ghi chú phê duyệt</span>
                            <input
                              value={milestone.description}
                              onChange={(event) => updateMilestoneField(index, 'description', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                              placeholder="Giai đoạn này cần kiểm tra những gì?"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${
                    milestoneTotalMatchesBudget
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold">Tổng milestone: {formatMoneyPreview(`${milestoneTotal}`, '0 VND')}</span>
                      <span className="font-semibold">Ngân sách: {formatMoneyPreview(jobForm.budget, '0 VND')}</span>
                    </div>
                    <p className="mt-2">
                      {milestoneTotalMatchesBudget
                        ? 'Tổng milestone khớp với ngân sách công việc.'
                        : `Tổng milestone phải bằng ngân sách trước khi đăng. Chênh lệch: ${formatMoneyPreview(`${Math.abs(budgetDifference)}`, '0 VND')}`}
                    </p>
                  </div>
                </div>
                {jobStatus.message ? (
                  <p className={`rounded-2xl px-4 py-3 text-sm ${jobStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {jobStatus.message}
                  </p>
                ) : null}
                <button type="submit" disabled={jobSaving} className="inline-flex items-center gap-2 rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {jobSaving ? (isEditMode ? 'Đang lưu...' : 'Đang tạo...') : (isEditMode ? 'Lưu thay đổi' : 'Tạo công việc')}
                </button>
              </form>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddJob;

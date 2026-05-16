import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CircleDollarSign, ClipboardCheck, Clock3, Eye, MapPin, MessageSquareMore, Search, Shield, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import JobCard from '../components/JobCard';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import { chatThreads, contracts, disputes, sidebarItems } from '../data/mockData';

const pageTabs = ['dashboard', 'marketplace', 'contracts', 'chat', 'escrow', 'disputes'];
const translations = {
  en: {
    topbarSubtitle: 'Client workspace for approvals, protected payments, and supplier management',
    logout: 'Logout',
    searchPlaceholder: 'Search talent or briefs',
    marketplaceLabel: 'Talent Marketplace',
    marketplaceHeading: 'Recommended talent and active hiring briefs',
    jobOverview: 'Job overview',
    selectedJobPlaceholder: 'Select a job to view details',
    selectedJobHint: 'Click any job card to see the customer requirements and project overview here.',
    requirementsHeading: 'What client needs',
    detailsHeading: 'Job details',
    budgetLabel: 'Budget / rate',
    clientLabel: 'Pipeline',
    dashboardHeroTitle: 'Client Command Center',
    dashboardHeroSubtitle: 'Manage hiring, approvals, and escrow releases',
    dashboardHeroBody: 'Review incoming work, approve milestones, track protected budget, and keep every contract under control from one client workspace.',
    dashboardAddJob: 'Add Job',
    dashboardReviewProposals: 'Review Proposals',
    dashboardFundEscrow: 'Fund Escrow',
    pendingApprovalsLabel: 'Pending approvals',
    pendingApprovalsSummary: 'Milestones waiting for your review this week.',
    payMilestone: 'Pay milestone',
    clientActivityLabel: 'Client activity',
    clientActivityHeading: 'Hiring and approval overview',
    addJobHeading: 'Add New Job',
    addJobDescription: 'Create a new job posting for the client marketplace.',
    jobTitleLabel: 'Job title',
    budgetFormLabel: 'Budget',
    categoryLabel: 'Category',
    clientFormLabel: 'Client',
    durationLabel: 'Project duration',
    locationLabel: 'Location',
    freelancersNeededLabel: 'Freelancers needed',
    deadlineLabel: 'Deadline',
    availabilityLabel: 'Availability',
    hourlyRateLabel: 'Hourly rate',
    completedJobsLabel: 'Completed jobs',
    completionRateLabel: 'Completion rate',
    responseTimeLabel: 'Response time',
    clientRatingViewLabel: 'Client rating',
    escrowSuccessRateLabel: 'Escrow success rate',
    requiredSkillsLabel: 'Required skills',
    attachmentsLabel: 'Attachments',
    descriptionLabel: 'Description',
    placeholderJobTitle: 'e.g. React dashboard redesign',
    placeholderBudget: '3,500,000 - 5,000,000 VND',
    placeholderClient: 'Your company or team',
    placeholderDuration: 'e.g. 3 weeks',
    placeholderLocation: 'e.g. Ho Chi Minh City or Remote',
    placeholderFreelancersNeeded: 'e.g. 1',
    placeholderDeadline: 'e.g. 31/05/2026',
    placeholderAvailability: 'e.g. Available in 3 days',
    placeholderHourlyRate: 'e.g. 680,000 VND/hr',
    placeholderCompletedJobs: 'e.g. 38',
    placeholderCompletionRate: 'e.g. 98%',
    placeholderResponseTime: 'e.g. 1 hour',
    placeholderRequiredSkills: 'e.g. React, Tailwind CSS, Node.js',
    placeholderAttachments: 'e.g. requirements.pdf, design.png',
    placeholderDescription: 'Describe the role, scope, and expected deliverables.',
    saveJobButton: 'Save job',
    cancelButton: 'Cancel',
    closeButton: 'X',
    fieldRequiredError: 'Please fill in all fields before adding the job.',
    escrowControl: 'Escrow Control',
    protectedBudget: 'Protected client budget',
    reservedProjectBudget: 'Reserved project budget',
    releasePayment: 'Release payment',
    createDeposit: 'Create deposit',
    escrowActions: 'Escrow actions',
    escrowHeading: 'Upcoming approvals and releases',
    escrowItems: ['Approve prototype milestone', 'Review final dashboard handoff', 'Release next escrow installment'],
    contractsLabel: 'Client contracts',
    contractsSummary: '{count} supplier agreements under your review',
    duePrefix: 'Due',
    reviewProductButton: 'Review Product',
    disputesLabel: 'Disputes',
    disputesHeading: 'Client dispute overview',
    activityResolved: 'Resolved',
    activityPending: 'Pending',
    sidebarLabels: {
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
    },
    titles: {
      dashboard: 'Client Dashboard',
      marketplace: 'Talent Marketplace',
      contracts: 'Client Contracts',
      chat: 'Client Chat',
      bank: 'Bank Account',
      escrow: 'Escrow Control',
      disputes: 'Disputes',
      settings: 'Settings',
    },
  },
  vi: {
    topbarSubtitle: 'Không gian làm việc của khách hàng để quản lý phê duyệt, thanh toán bảo mật và nhà cung cấp',
    logout: 'Đăng xuất',
    searchPlaceholder: 'Tìm kiếm talent hoặc công việc',
    marketplaceLabel: 'Thị trường nhân tài',
    marketplaceHeading: 'Nhân sự đề xuất và yêu cầu tuyển dụng đang hoạt động',
    jobOverview: 'Tổng quan công việc',
    selectedJobPlaceholder: 'Nhấp vào thẻ công việc để xem yêu cầu khách hàng và tổng quan dự án ở đây.',
    selectedJobHint: 'Nhấp vào một thẻ công việc để xem yêu cầu khách hàng và tổng quan dự án.',
    requirementsHeading: 'Yêu cầu của khách hàng',
    detailsHeading: 'Chi tiết công việc',
    budgetLabel: 'Ngân sách / giá',
    clientLabel: 'Nguồn',
    dashboardHeroTitle: 'Trung tâm điều khiển khách hàng',
    dashboardHeroSubtitle: 'Quản lý tuyển dụng, phê duyệt và escrow',
    dashboardHeroBody: 'Xem xét công việc đến, phê duyệt milestone, theo dõi ngân sách bảo vệ và giữ mọi hợp đồng dưới quyền kiểm soát trong một không gian làm việc.',
    dashboardAddJob: 'Thêm công việc',
    dashboardReviewProposals: 'Xem đề xuất',
    dashboardFundEscrow: 'Nạp Escrow',
    pendingApprovalsLabel: 'Phê duyệt đang chờ',
    pendingApprovalsSummary: 'Các milestone đang chờ bạn xem xét trong tuần này.',
    payMilestone: 'Thanh toán milestone',
    clientActivityLabel: 'Hoạt động khách hàng',
    clientActivityHeading: 'Tổng quan tuyển dụng và phê duyệt',
    addJobHeading: 'Thêm công việc mới',
    addJobDescription: 'Tạo một yêu cầu công việc mới cho thị trường khách hàng.',
    jobTitleLabel: 'Tiêu đề công việc',
    budgetFormLabel: 'Ngân sách',
    categoryLabel: 'Danh mục',
    clientFormLabel: 'Khách hàng',
    durationLabel: 'Thời gian dự án',
    locationLabel: 'Địa điểm',
    freelancersNeededLabel: 'Số freelancer cần tuyển',
    deadlineLabel: 'Hạn chót',
    availabilityLabel: 'Thời gian có thể bắt đầu',
    hourlyRateLabel: 'Mức giá theo giờ',
    completedJobsLabel: 'Số job đã hoàn thành',
    completionRateLabel: 'Tỷ lệ hoàn thành',
    responseTimeLabel: 'Thời gian phản hồi',
    clientRatingViewLabel: 'Đánh giá client',
    escrowSuccessRateLabel: 'Tỷ lệ escrow thành công',
    requiredSkillsLabel: 'Kỹ năng yêu cầu',
    attachmentsLabel: 'Tệp đính kèm',
    descriptionLabel: 'Mô tả',
    placeholderJobTitle: 'ví dụ: Thiết kế dashboard React',
    placeholderBudget: '3,500,000 - 5,000,000 VND',
    placeholderClient: 'Công ty hoặc đội của bạn',
    placeholderDuration: 'ví dụ: 3 tuần',
    placeholderLocation: 'ví dụ: Hà Nội hoặc Remote',
    placeholderFreelancersNeeded: 'ví dụ: 1',
    placeholderDeadline: 'ví dụ: 31/05/2026',
    placeholderAvailability: 'ví dụ: Có thể bắt đầu sau 3 ngày',
    placeholderHourlyRate: 'ví dụ: 680,000 VND/giờ',
    placeholderCompletedJobs: 'ví dụ: 38',
    placeholderCompletionRate: 'ví dụ: 98%',
    placeholderResponseTime: 'ví dụ: 1 giờ',
    placeholderRequiredSkills: 'ví dụ: React, Tailwind CSS, Node.js',
    placeholderAttachments: 'ví dụ: requirements.pdf, design.png',
    placeholderDescription: 'Mô tả vai trò, phạm vi và kết quả mong muốn.',
    saveJobButton: 'Lưu công việc',
    cancelButton: 'Hủy',
    closeButton: 'X',
    fieldRequiredError: 'Vui lòng điền đầy đủ thông tin trước khi thêm công việc.',
    escrowControl: 'Quản lý Escrow',
    protectedBudget: 'Ngân sách bảo vệ',
    reservedProjectBudget: 'Ngân sách dự án đã dành',
    releasePayment: 'Giải ngân thanh toán',
    createDeposit: 'Tạo nạp tiền',
    escrowActions: 'Hành động Escrow',
    escrowHeading: 'Phê duyệt và giải ngân sắp tới',
    escrowItems: ['Phê duyệt milestone prototype', 'Xem xét bàn giao dashboard cuối', 'Giải ngân installment escrow tiếp theo'],
    contractsLabel: 'Hợp đồng khách hàng',
    contractsSummary: '{count} hợp đồng nhà cung cấp đang chờ bạn xem xét',
    duePrefix: 'Hạn chót',
    reviewProductButton: 'Xem sản phẩm',
    disputesLabel: 'Tranh chấp',
    disputesHeading: 'Tổng quan tranh chấp khách hàng',
    activityResolved: 'Đã giải quyết',
    activityPending: 'Đang chờ',
    sidebarLabels: {
      Dashboard: 'Bảng điều khiển',
      Jobs: 'Công việc',
      Contracts: 'Hợp đồng',
      Chat: 'Chat',
      'Bank Account': 'Tài khoản ngân hàng',
      Payments: 'Thanh toán',
      Disputes: 'Tranh chấp',
      workspace: 'Không gian làm việc',
      trustCenter: 'Bảng điều khiển khách hàng',
      workspaceDesc: 'Quản lý tuyển dụng, phê duyệt, nạp escrow và tranh chấp từ một trung tâm khách hàng.',
      balanceProtected: 'Ngân sách bảo vệ',
      balanceDesc: 'Đã dành cho các hợp đồng nhà cung cấp đang hoạt động.',
    },
    titles: {
      dashboard: 'Bảng điều khiển khách hàng',
      marketplace: 'Thị trường nhân tài',
      contracts: 'Hợp đồng khách hàng',
      chat: 'Chat khách hàng',
      bank: 'Tài khoản ngân hàng',
      escrow: 'Quản lý escrow',
      disputes: 'Tranh chấp',
      settings: 'Cài đặt',
    },
  },
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
const clientStats = [
  { label: 'Open jobs', value: '12', hint: '4 new proposals today', icon: BriefcaseBusiness, accent: 'bg-pine/10 text-pine' },
  { label: 'Pending approvals', value: '3', hint: 'Milestones waiting for review', icon: ClipboardCheck, accent: 'bg-coral/10 text-coral' },
  { label: 'Protected spend', value: '18,400,000 VND', hint: '6,200,000 VND currently held in escrow', icon: CircleDollarSign, accent: 'bg-gold/10 text-gold' },
];
const clientActivities = [
  { title: 'Proposal shortlist updated', description: '3 freelancers were moved to the final review stage for the dashboard redesign role.', time: '20 minutes ago', icon: Users },
  { title: 'Milestone awaiting approval', description: 'Prototype & Animations was submitted and is waiting for your review.', time: '2 hours ago', icon: ClipboardCheck },
  { title: 'Escrow funded successfully', description: 'A new milestone deposit was confirmed for the mobile app design contract.', time: 'Yesterday', icon: Shield },
];
const clientCards = [
  {
    title: 'Senior React freelancer shortlist',
    budget: '4,500,000 VND',
    client: 'Acme Ventures',
    category: 'Development',
    description: 'Review top candidates for your trust portal build and compare availability, rates, and ratings.',
    requirements: 'Create a responsive React dashboard with escrow management, contract approvals, and client-facing job controls. Focus on clean UI, mobile support, and secure milestone workflows.',
    posted: '2 days ago',
    delivery: '2 weeks',
    proposals: '18 proposals',
    level: 'Expert',
    location: 'Remote',
    deadline: '30 May 2026',
    freelancersNeeded: '3 freelancers',
    skills: ['React', 'Tailwind CSS', 'Node.js', 'Escrow workflow'],
    scope: [
      'Build responsive client dashboard pages',
      'Implement job listing and detail modal',
      'Add secure milestone approval flows',
    ],
    attachments: ['requirements.pdf', 'design.png', 'contract.docx'],
    clientInfo: {
      name: 'Acme Ventures',
      role: 'Client',
      memberSince: '2022',
      jobsPosted: 22,
      hireRate: '85%',
    },
  },
  {
    title: 'UI/UX designer recommendations',
    budget: '3,000,000 VND',
    client: 'Bridge Legal',
    category: 'Design',
    description: 'Hand-picked designers with strong escrow workflow and product interface experience.',
    requirements: 'Design polished product screens and onboarding flows that match the trust platform brand. Deliver Figma high-fidelity layouts and prototype interactions.',
    posted: '4 days ago',
    delivery: '10 days',
    proposals: '12 proposals',
    level: 'Intermediate',
    location: 'Remote',
    deadline: '5 June 2026',
    freelancersNeeded: '2 freelancers',
    skills: ['Figma', 'UX research', 'Product design', 'Onboarding flows'],
    scope: [
      'Create high-fidelity dashboards and workflow screens',
      'Design mobile and desktop responsive layouts',
      'Prepare design handoff documentation',
    ],
    attachments: ['brief.pdf', 'screens.png', 'styleguide.docx'],
    clientInfo: {
      name: 'Bridge Legal',
      role: 'Client',
      memberSince: '2023',
      jobsPosted: 14,
      hireRate: '78%',
    },
  },
];

function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fptp_user') || '{}'));
  const [activePage, setActivePage] = useState('dashboard');
  const [settingsSection, setSettingsSection] = useState('profile');
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id ?? 1);
  const [query, setQuery] = useState('');
  const [jobList, setJobList] = useState(() => {
    const saved = localStorage.getItem('client_jobs');
    return saved ? JSON.parse(saved) : clientCards;
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobBudget, setNewJobBudget] = useState('');
  const [newJobCategory, setNewJobCategory] = useState('Development');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [newJobClient, setNewJobClient] = useState(user?.fullName || 'Your company');
  const [newJobDuration, setNewJobDuration] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobFreelancersNeeded, setNewJobFreelancersNeeded] = useState('');
  const [newJobDeadline, setNewJobDeadline] = useState('');
  const [newJobAvailability, setNewJobAvailability] = useState('');
  const [newJobHourlyRate, setNewJobHourlyRate] = useState('');
  const [newJobCompletedJobs, setNewJobCompletedJobs] = useState('');
  const [newJobCompletionRate, setNewJobCompletionRate] = useState('');
  const [newJobResponseTime, setNewJobResponseTime] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobAttachments, setNewJobAttachments] = useState('');
  const [newJobError, setNewJobError] = useState('');

  const selectedContract = contracts.find((item) => item.id === selectedContractId) ?? contracts[0];
  const selectedJobClientInfo = selectedJob?.clientInfo || {
    name: selectedJob?.client || 'Client',
    role: 'Client',
    memberSince: '2024',
    jobsPosted: 1,
    hireRate: 'N/A',
  };

  const language = user?.settings?.language || 'en';
  const activeCopy = translations[language];
  const activeLabels = activeCopy.sidebarLabels || labels;

  const logout = () => {
    localStorage.removeItem('fptp_token');
    localStorage.removeItem('fptp_user');
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = (languageToSet) => {
    const nextUser = {
      ...user,
      settings: {
        ...user?.settings,
        language: languageToSet,
      },
    };

    setUser(nextUser);
    localStorage.setItem('fptp_user', JSON.stringify(nextUser));
  };

  useEffect(() => {
    localStorage.setItem('client_jobs', JSON.stringify(jobList));
  }, [jobList]);

  useEffect(() => {
    if (activePage !== 'marketplace' && selectedJob) {
      setSelectedJob(null);
    }
  }, [activePage, selectedJob]);

  const handleAddJobSubmit = (event) => {
    event.preventDefault();
    setNewJobError('');

    if (
      !newJobTitle.trim() ||
      !newJobBudget.trim() ||
      !newJobDescription.trim() ||
      !newJobClient.trim() ||
      !newJobDuration.trim() ||
      !newJobLocation.trim() ||
      !newJobFreelancersNeeded.trim() ||
      !newJobDeadline.trim() ||
      !newJobAvailability.trim() ||
      !newJobHourlyRate.trim() ||
      !newJobCompletedJobs.trim() ||
      !newJobCompletionRate.trim() ||
      !newJobResponseTime.trim()
    ) {
      setNewJobError(activeCopy.fieldRequiredError);
      return;
    }

    const skillList = newJobSkills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const attachmentList = newJobAttachments
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const newJob = {
      title: newJobTitle.trim(),
      budget: newJobBudget.trim(),
      client: newJobClient.trim(),
      category: newJobCategory,
      description: newJobDescription.trim(),
      requirements: newJobDescription.trim(),
      posted: 'Just now',
      location: newJobLocation.trim(),
      level: 'Intermediate',
      delivery: newJobDuration.trim(),
      deadline: newJobDeadline.trim(),
      availability: newJobAvailability.trim(),
      hourlyRate: newJobHourlyRate.trim(),
      completedJobs: newJobCompletedJobs.trim(),
      completionRate: newJobCompletionRate.trim(),
      responseTime: newJobResponseTime.trim(),
      clientRating: '4.9 / 5',
      escrowSuccessRate: '100%',
      freelancersNeeded: `${newJobFreelancersNeeded.trim()} freelancer${newJobFreelancersNeeded.trim() === '1' ? '' : 's'}`,
      skills: skillList,
      attachments: attachmentList,
      clientInfo: {
        name: newJobClient.trim(),
        role: 'Client',
        memberSince: '2024',
        jobsPosted: 1,
        hireRate: 'N/A',
      },
    };

    setJobList((prev) => [newJob, ...prev]);
    setIsAddJobModalOpen(false);
    setNewJobTitle('');
    setNewJobBudget('');
    setNewJobCategory('Development');
    setNewJobDescription('');
    setNewJobDuration('');
    setNewJobLocation('');
    setNewJobFreelancersNeeded('');
    setNewJobDeadline('');
    setNewJobAvailability('');
    setNewJobHourlyRate('');
    setNewJobCompletedJobs('');
    setNewJobCompletionRate('');
    setNewJobResponseTime('');
    setNewJobSkills('');
    setNewJobAttachments('');
    setNewJobError('');
  };

  const dashboardLayout = (content) => (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-4 sm:px-6 xl:px-8">
        <Sidebar items={sidebarItems} activePage={activePage} onNavigate={setActivePage} labels={activeLabels} />
        <div className="min-w-0 flex-1 space-y-6">
          <Topbar
            title={activeCopy.titles[activePage]}
            subtitle={activeCopy.topbarSubtitle}
            onLogout={logout}
            onOpenSettings={() => {
              setSettingsSection('profile');
              setActivePage('settings');
            }}
            onOpenBankSettings={() => {
              setActivePage('bank');
            }}
            language={language}
            onLanguageChange={handleLanguageChange}
            copy={{ role: 'client', logout: activeCopy.logout }}
            user={user}
          />
          <div className="flex flex-wrap gap-2">
            {pageTabs.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activePage === page ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
              >
                {activeCopy.titles[page]}
              </button>
            ))}
          </div>
          {content}
        </div>
      </div>
    </div>
  );

  if (activePage === 'marketplace') {
    const list = jobList.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.client.toLowerCase().includes(query.toLowerCase()));
    return dashboardLayout(
      <div className="space-y-6">
        <SectionCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="muted">{activeCopy.marketplaceLabel}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{activeCopy.marketplaceHeading}</h2>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeCopy.searchPlaceholder} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-60" />
            </label>
          </div>
        </SectionCard>
        <div className="grid gap-4">
          {list.map((item) => (
            <JobCard
              key={item.title}
              job={item}
              labels={{ budget: activeCopy.budgetLabel, client: activeCopy.clientLabel, view: language === 'vi' ? 'Xem chi tiết' : 'View details' }}
              onView={() => setSelectedJob(item)}
            />
          ))}
        </div>
        {selectedJob ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
            <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] bg-slate-100 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {activeCopy.closeButton}
              </button>
              <div className="max-h-[84vh] overflow-y-auto p-3 sm:p-4">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] bg-[#091839] p-6 text-white">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/85">
                        {selectedJob.category}
                      </span>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Verified project
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-bold leading-tight">{selectedJob.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-white/80">
                      {selectedJob.requirements || selectedJob.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(selectedJob.skills?.length ? selectedJob.skills : ['Secure workflow', 'Escrow-ready delivery', 'Fast response']).slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.clientLabel}</p>
                        <p className="mt-1 text-xl font-semibold text-white">{selectedJob.client || '-'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.durationLabel}</p>
                        <p className="mt-1 text-xl font-semibold text-white">{selectedJob.delivery || 'TBD'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.freelancersNeededLabel}</p>
                        <p className="mt-1 text-xl font-semibold text-white">{selectedJob.freelancersNeeded || '1 freelancer'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.deadlineLabel}</p>
                        <p className="mt-1 text-xl font-semibold text-white">{selectedJob.deadline || 'TBD'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.hourlyRateLabel}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{selectedJob.hourlyRate || selectedJob.budget}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.completedJobsLabel}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{selectedJob.completedJobs || '38'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.completionRateLabel}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{selectedJob.completionRate || '98%'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-xs text-white/70">{activeCopy.responseTimeLabel}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{selectedJob.responseTime || '1 hour'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[24px] bg-white p-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{activeCopy.locationLabel}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-ink">
                        <MapPin className="h-5 w-5 text-pine" />
                        {selectedJob.location || 'Remote'}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{activeCopy.availabilityLabel}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-ink">
                        <Clock3 className="h-5 w-5 text-pine" />
                        {selectedJob.availability || 'Available in 3 days'}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{activeCopy.clientRatingViewLabel}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-ink">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        {selectedJob.clientRating || '4.9 / 5'}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{activeCopy.escrowSuccessRateLabel}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-ink">
                        <Shield className="h-5 w-5 text-pine" />
                        {selectedJob.escrowSuccessRate || '100%'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Invite to job</button>
                      <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Start protected contract</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>,
    );
  }

  if (activePage === 'contracts') {
    return dashboardLayout(
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">{activeCopy.contractsLabel}</h2>
          <p className="mt-2 text-sm text-slate-500">{activeCopy.contractsSummary.replace('{count}', contracts.length)}</p>
        </div>
        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            {contracts.map((contract) => (
              <button key={contract.id} onClick={() => setSelectedContractId(contract.id)} className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-sm transition ${contract.id === selectedContract.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-xl font-semibold text-ink">{contract.title.en}</p>
                <p className="mt-1 text-sm text-slate-500">{contract.client}</p>
                <p className="mt-5 text-2xl font-bold text-ink">{contract.budget}</p>
              </button>
            ))}
          </div>
          <SectionCard className="p-6">
            <h3 className="text-2xl font-bold text-ink">{selectedContract.title.en}</h3>
            <p className="mt-2 text-slate-500">{selectedContract.client}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div><p className="text-sm text-slate-500">Approved budget</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.budget}</p></div>
              <div><p className="text-sm text-slate-500">Released so far</p><p className="mt-2 text-2xl font-bold text-emerald-600">{selectedContract.earned}</p></div>
              <div><p className="text-sm text-slate-500">Progress</p><p className="mt-2 text-2xl font-bold text-ink">{selectedContract.progress}%</p></div>
            </div>
            <div className="mt-8 space-y-4">
              {selectedContract.milestones.map((milestone) => (
                <div key={milestone.title.en} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-ink">{milestone.title.en}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{milestone.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{activeCopy.duePrefix} {milestone.dueDate} · {milestone.amount}</p>
                      <p className="mt-2 text-sm text-slate-500">{milestone.reviewNote}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {milestone.reviewAction ? (
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600">
                          <Eye className="h-4 w-4" />
                          {milestone.reviewAction}
                        </button>
                      ) : null}
                      {(milestone.action === 'Approve' || milestone.reviewAction === 'Review Product') ? (
                        <button className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                          <MessageSquareMore className="h-4 w-4" />
                          {activeCopy.reviewProductButton}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>,
    );
  }

  if (activePage === 'escrow') {
    return dashboardLayout(
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard className="p-6">
          <p className="muted">{activeCopy.escrowControl}</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{activeCopy.protectedBudget}</h2>
          <div className="mt-6 rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm text-white/70">{activeCopy.reservedProjectBudget}</p>
            <p className="mt-2 text-4xl font-bold">18,400,000 VND</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink">{activeCopy.releasePayment}</button>
              <button className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">{activeCopy.createDeposit}</button>
            </div>
          </div>
        </SectionCard>
        <SectionCard className="p-6">
          <p className="muted">{activeCopy.escrowActions}</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{activeCopy.escrowHeading}</h2>
          <div className="mt-6 space-y-4">
            {activeCopy.escrowItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SectionCard>
      </div>,
    );
  }

  if (activePage === 'chat') {
    return dashboardLayout(
      <ChatPanel
        userRole="client"
        userName={user?.fullName || user?.email || 'Client'}
        threads={chatThreads.map((thread) => ({
          ...thread,
          participantRole: 'Freelancer',
          participant: thread.messages.find((message) => message.senderRole === 'freelancer')?.senderName || thread.participant,
        }))}
      />,
    );
  }

  if (activePage === 'bank') {
    return dashboardLayout(
      <SettingsPanel user={user} onUserChange={setUser} initialSection="bank" mode="bank" />,
    );
  }

  if (activePage === 'disputes') {
    return dashboardLayout(
      <SectionCard className="p-6">
        <p className="muted">{activeCopy.disputesLabel}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{activeCopy.disputesHeading}</h2>
        <div className="mt-6 space-y-4">
          {disputes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">{item.title.en}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.contract.en} · {item.amount}</p>
            </div>
          ))}
        </div>
      </SectionCard>,
    );
  }

  if (activePage === 'settings') {
    return dashboardLayout(
      <SettingsPanel user={user} onUserChange={setUser} initialSection={settingsSection} />,
    );
  }

  return dashboardLayout(
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-ink px-6 py-8 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{activeCopy.dashboardHeroTitle}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{activeCopy.dashboardHeroSubtitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">{activeCopy.dashboardHeroBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setIsAddJobModalOpen(true)} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink">{activeCopy.dashboardAddJob}</button>
              <button onClick={() => setActivePage('marketplace')} className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">{activeCopy.dashboardReviewProposals}</button>
              <button onClick={() => setActivePage('escrow')} className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">{activeCopy.dashboardFundEscrow}</button>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-8 sm:px-8">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{activeCopy.pendingApprovalsLabel}</p><p className="mt-2 text-3xl font-bold text-ink">3</p><p className="mt-2 text-sm text-slate-500">{activeCopy.pendingApprovalsSummary}</p><button onClick={() => setActivePage('escrow')} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">{activeCopy.payMilestone}</button></div>
            </div>
          </div>
        </div>
      </SectionCard>
      <section className="grid gap-5 md:grid-cols-3">
        {clientStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <SectionCard className="p-6">
        <div><p className="muted">{activeCopy.clientActivityLabel}</p><h2 className="mt-1 text-xl font-bold text-ink">{activeCopy.clientActivityHeading}</h2></div>
        <div className="mt-6 space-y-4">
          {clientActivities.map((activity) => <div key={activity.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mt-1 rounded-2xl bg-white p-3 shadow-sm"><activity.icon className="h-5 w-5 text-pine" /></div><div className="flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">{activity.title}</h3><span className="text-sm text-slate-400">{activity.time}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{activity.description}</p></div></div>)}
        </div>
      </SectionCard>
      {isAddJobModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-ink">{activeCopy.addJobHeading}</h2>
                <p className="mt-2 text-sm text-slate-500">{activeCopy.addJobDescription}</p>
              </div>
              <button onClick={() => setIsAddJobModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{activeCopy.closeButton}</button>
            </div>
            <form onSubmit={handleAddJobSubmit} className="mt-5 space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.jobTitleLabel}</span>
                  <input value={newJobTitle} onChange={(event) => setNewJobTitle(event.target.value)} placeholder={activeCopy.placeholderJobTitle} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.budgetFormLabel}</span>
                  <input value={newJobBudget} onChange={(event) => setNewJobBudget(event.target.value)} placeholder={activeCopy.placeholderBudget} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.categoryLabel}</span>
                  <select value={newJobCategory} onChange={(event) => setNewJobCategory(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none">
                    <option>Development</option>
                    <option>Design</option>
                    <option>Security</option>
                    <option>Legal</option>
                    <option>Marketing</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.clientFormLabel}</span>
                  <input value={newJobClient} onChange={(event) => setNewJobClient(event.target.value)} placeholder={activeCopy.placeholderClient} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.durationLabel}</span>
                  <input value={newJobDuration} onChange={(event) => setNewJobDuration(event.target.value)} placeholder={activeCopy.placeholderDuration} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.freelancersNeededLabel}</span>
                  <input value={newJobFreelancersNeeded} onChange={(event) => setNewJobFreelancersNeeded(event.target.value)} placeholder={activeCopy.placeholderFreelancersNeeded} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.deadlineLabel}</span>
                  <input value={newJobDeadline} onChange={(event) => setNewJobDeadline(event.target.value)} placeholder={activeCopy.placeholderDeadline} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.availabilityLabel}</span>
                  <input value={newJobAvailability} onChange={(event) => setNewJobAvailability(event.target.value)} placeholder={activeCopy.placeholderAvailability} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.hourlyRateLabel}</span>
                  <input value={newJobHourlyRate} onChange={(event) => setNewJobHourlyRate(event.target.value)} placeholder={activeCopy.placeholderHourlyRate} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.completedJobsLabel}</span>
                  <input value={newJobCompletedJobs} onChange={(event) => setNewJobCompletedJobs(event.target.value)} placeholder={activeCopy.placeholderCompletedJobs} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.completionRateLabel}</span>
                  <input value={newJobCompletionRate} onChange={(event) => setNewJobCompletionRate(event.target.value)} placeholder={activeCopy.placeholderCompletionRate} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{activeCopy.responseTimeLabel}</span>
                  <input value={newJobResponseTime} onChange={(event) => setNewJobResponseTime(event.target.value)} placeholder={activeCopy.placeholderResponseTime} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{activeCopy.locationLabel}</span>
                <input value={newJobLocation} onChange={(event) => setNewJobLocation(event.target.value)} placeholder={activeCopy.placeholderLocation} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{activeCopy.requiredSkillsLabel}</span>
                <input value={newJobSkills} onChange={(event) => setNewJobSkills(event.target.value)} placeholder={activeCopy.placeholderRequiredSkills} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{activeCopy.attachmentsLabel}</span>
                <input value={newJobAttachments} onChange={(event) => setNewJobAttachments(event.target.value)} placeholder={activeCopy.placeholderAttachments} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">{activeCopy.descriptionLabel}</span>
                <textarea value={newJobDescription} onChange={(event) => setNewJobDescription(event.target.value)} rows={4} placeholder={activeCopy.placeholderDescription} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none" />
              </label>
              {newJobError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{newJobError}</div> : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">{activeCopy.saveJobButton}</button>
                <button type="button" onClick={() => setIsAddJobModalOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">{activeCopy.cancelButton}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>,
  );

}

export default ClientDashboard;

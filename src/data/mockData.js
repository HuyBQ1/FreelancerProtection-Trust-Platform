import {
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

export const sidebarItems = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Jobs', page: 'marketplace' },
  { label: 'Contracts', page: 'contracts' },
  { label: 'Payments', page: 'escrow' },
  { label: 'Disputes', page: 'contracts' },
];

export const stats = [
  {
    label: { en: 'Total jobs', vi: 'Tổng công việc' },
    value: '128',
    hint: { en: '+14% this month', vi: '+14% tháng này' },
    icon: BriefcaseBusiness,
    accent: 'bg-pine/10 text-pine',
  },
  {
    label: { en: 'Active contracts', vi: 'Hợp đồng đang chạy' },
    value: '18',
    hint: { en: '6 awaiting approval', vi: '6 đang chờ phê duyệt' },
    icon: ClipboardList,
    accent: 'bg-coral/10 text-coral',
  },
  {
    label: { en: 'Balance', vi: 'Số dư' },
    value: '$24,600',
    hint: { en: '$8,400 held in escrow', vi: '$8,400 đang được giữ trong escrow' },
    icon: CircleDollarSign,
    accent: 'bg-gold/10 text-gold',
  },
];

export const activities = [
  {
    title: {
      en: 'Milestone approved by BrightSide Studio',
      vi: 'Milestone đã được BrightSide Studio phê duyệt',
    },
    description: {
      en: 'The client approved your high-fidelity dashboard designs and released $2,400.',
      vi: 'Khách hàng đã phê duyệt bộ thiết kế dashboard chi tiết và giải ngân $2,400.',
    },
    time: { en: '2 hours ago', vi: '2 giờ trước' },
    icon: ShieldCheck,
  },
  {
    title: {
      en: 'Escrow funded for mobile app audit',
      vi: 'Escrow đã được nạp cho hợp đồng kiểm tra app mobile',
    },
    description: {
      en: 'A new client deposited the first milestone amount to begin security review work.',
      vi: 'Khách hàng mới đã nộp tiền milestone đầu tiên để bắt đầu quá trình đánh giá bảo mật.',
    },
    time: { en: '5 hours ago', vi: '5 giờ trước' },
    icon: Landmark,
  },
  {
    title: {
      en: 'Contract updated with delivery notes',
      vi: 'Hợp đồng đã được cập nhật với ghi chú bàn giao',
    },
    description: {
      en: 'The product copy contract now includes revised scope details and protection terms.',
      vi: 'Hợp đồng đã bổ sung phạm vi công việc mới và các điều khoản bảo vệ.',
    },
    time: { en: 'Yesterday', vi: 'Hôm qua' },
    icon: ClipboardList,
  },
];

export const jobs = [
  {
    title: {
      en: 'Fintech dashboard redesign with escrow milestones',
      vi: 'Thiết kế lại dashboard fintech theo milestone escrow',
    },
    budget: '$3,500 - $5,000',
    client: 'Northstar Capital',
    category: { en: 'Design', vi: 'Thiết kế' },
    description: {
      en: 'Looking for a senior product designer to modernize a compliance-heavy dashboard experience.',
      vi: 'Tìm product designer cấp cao để hiện đại hóa dashboard có nhiều yêu cầu tuân thủ.',
    },
  },
  {
    title: {
      en: 'React frontend for trust verification portal',
      vi: 'Frontend React cho cổng thông tin xác minh uy tín',
    },
    budget: '$4,200',
    client: 'SecureFlow Labs',
    category: { en: 'Development', vi: 'Phát triển' },
    description: {
      en: 'Build a responsive portal for identity checks, contract evidence, and payout controls.',
      vi: 'Xây dựng cổng thông tin responsive cho xác minh danh tính, bằng chứng hợp đồng và kiểm soát thanh toán.',
    },
  },
  {
    title: {
      en: 'Platform security audit for freelance marketplace',
      vi: 'Đánh giá bảo mật nền tảng marketplace freelance',
    },
    budget: '$6,000',
    client: 'Helix Networks',
    category: { en: 'Security', vi: 'Bảo mật' },
    description: {
      en: 'Review web app security posture, transaction protection, and file delivery risk.',
      vi: 'Đánh giá bảo mật ứng dụng web, cơ chế bảo vệ giao dịch và rủi ro khi bàn giao tệp.',
    },
  },
  {
    title: {
      en: 'Dispute policy and contract language refresh',
      vi: 'Cập nhật chính sách tranh chấp và ngôn ngữ hợp đồng',
    },
    budget: '$1,800',
    client: 'Bridge Legal',
    category: { en: 'Legal', vi: 'Pháp lý' },
    description: {
      en: 'Refine contract templates and approval workflows for dispute-prevention clarity.',
      vi: 'Tối ưu mẫu hợp đồng và quy trình phê duyệt để giảm tranh chấp.',
    },
  },
];

export const contracts = [
  {
    id: 1,
    initials: 'AC',
    title: { en: 'Mobile App UI Design', vi: 'Thiết kế UI ứng dụng di động' },
    client: 'Acme Corp',
    budget: '$4,200',
    earned: '$800',
    startDate: 'Mar 1, 2026',
    endDate: 'Apr 15, 2026',
    progress: 50,
    completedMilestones: 2,
    totalMilestones: 4,
    status: 'Active',
    milestones: [
      {
        title: { en: 'Wireframes & User Flows', vi: 'Wireframe và luồng người dùng' },
        dueDate: 'Mar 10',
        amount: '$800',
        status: 'Approved',
        action: null,
      },
      {
        title: { en: 'High-Fidelity Mockups', vi: 'Mockup chi tiết' },
        dueDate: 'Mar 25',
        amount: '$1,600',
        status: 'Completed',
        action: 'Approve',
      },
      {
        title: { en: 'Prototype & Animations', vi: 'Prototype và animation' },
        dueDate: 'Apr 5',
        amount: '$1,200',
        status: 'In Progress',
        action: 'Submit Work',
      },
      {
        title: { en: 'Handoff & Documentation', vi: 'Bàn giao và tài liệu' },
        dueDate: 'Apr 15',
        amount: '$600',
        status: 'Pending',
        action: null,
      },
    ],
  },
  {
    id: 2,
    initials: 'SX',
    title: { en: 'Brand Identity Package', vi: 'Gói nhận diện thương hiệu' },
    client: 'StartupXYZ',
    budget: '$2,200',
    earned: '$2,200',
    startDate: 'Feb 3, 2026',
    endDate: 'Mar 2, 2026',
    progress: 100,
    completedMilestones: 3,
    totalMilestones: 3,
    status: 'Completed',
    milestones: [
      {
        title: { en: 'Brand Discovery', vi: 'Khám phá thương hiệu' },
        dueDate: 'Feb 8',
        amount: '$500',
        status: 'Approved',
        action: null,
      },
      {
        title: { en: 'Logo Concepts', vi: 'Ý tưởng logo' },
        dueDate: 'Feb 18',
        amount: '$900',
        status: 'Approved',
        action: null,
      },
      {
        title: { en: 'Final Brand Kit', vi: 'Bộ nhận diện cuối cùng' },
        dueDate: 'Mar 2',
        amount: '$800',
        status: 'Completed',
        action: null,
      },
    ],
  },
];

export const escrowSummary = {
  amount: '$8,400',
  status: 'Held',
  timeline: [
    { label: 'Funds deposited', date: 'Mar 12, 2026', state: 'Completed' },
    { label: 'Milestone under review', date: 'Mar 16, 2026', state: 'Held' },
    { label: 'Scheduled release window', date: 'Mar 20, 2026', state: 'Pending' },
  ],
};

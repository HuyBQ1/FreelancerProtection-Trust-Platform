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
  { label: 'Chat', page: 'chat' },
  { label: 'Payments', page: 'escrow' },
  { label: 'Disputes', page: 'disputes' },
];

export const chatThreads = [
  {
    id: 1,
    participant: 'Acme Corp',
    participantRole: 'Client',
    contract: 'Mobile App UI Design',
    unread: 2,
    lastMessage: 'Please share the latest prototype link before approval.',
    lastTime: '10:24 AM',
    messages: [
      { id: '1-1', senderRole: 'client', senderName: 'Acme Corp', text: 'Please share the latest prototype link before approval.', time: '10:24 AM' },
      { id: '1-2', senderRole: 'freelancer', senderName: 'Ariana Lee', text: 'Sure, I uploaded the newest animation pass and interaction notes.', time: '10:31 AM' },
      { id: '1-3', senderRole: 'client', senderName: 'Acme Corp', text: 'Great. I will review the product this afternoon and update the milestone.', time: '10:36 AM' },
    ],
  },
  {
    id: 2,
    participant: 'StartupXYZ',
    participantRole: 'Client',
    contract: 'Brand Identity Package',
    unread: 0,
    lastMessage: 'The final brand kit looks good. We will release the remaining payment.',
    lastTime: 'Yesterday',
    messages: [
      { id: '2-1', senderRole: 'freelancer', senderName: 'Ariana Lee', text: 'I have attached the final logo package and typography guide.', time: 'Yesterday' },
      { id: '2-2', senderRole: 'client', senderName: 'StartupXYZ', text: 'The final brand kit looks good. We will release the remaining payment.', time: 'Yesterday' },
    ],
  },
];

export const stats = [
  {
    label: { en: 'Total jobs', vi: 'Tá»•ng cÃ´ng viá»‡c' },
    value: '128',
    hint: { en: '+14% this month', vi: '+14% thÃ¡ng nÃ y' },
    icon: BriefcaseBusiness,
    accent: 'bg-pine/10 text-pine',
  },
  {
    label: { en: 'Active contracts', vi: 'Há»£p Ä‘á»“ng Ä‘ang cháº¡y' },
    value: '18',
    hint: { en: '6 awaiting approval', vi: '6 Ä‘ang chá» phÃª duyá»‡t' },
    icon: ClipboardList,
    accent: 'bg-coral/10 text-coral',
  },
  {
    label: { en: 'Balance', vi: 'Sá»‘ dÆ°' },
    value: '$24,600',
    hint: { en: '$8,400 held in escrow', vi: '$8,400 Ä‘ang Ä‘Æ°á»£c giá»¯ trong escrow' },
    icon: CircleDollarSign,
    accent: 'bg-gold/10 text-gold',
  },
];

export const activities = [
  {
    title: {
      en: 'Milestone approved by BrightSide Studio',
      vi: 'Milestone Ä‘Ã£ Ä‘Æ°á»£c BrightSide Studio phÃª duyá»‡t',
    },
    description: {
      en: 'The client approved your high-fidelity dashboard designs and released $2,400.',
      vi: 'KhÃ¡ch hÃ ng Ä‘Ã£ phÃª duyá»‡t bá»™ thiáº¿t káº¿ dashboard chi tiáº¿t vÃ  giáº£i ngÃ¢n $2,400.',
    },
    time: { en: '2 hours ago', vi: '2 giá» trÆ°á»›c' },
    icon: ShieldCheck,
  },
  {
    title: {
      en: 'Escrow funded for mobile app audit',
      vi: 'Escrow Ä‘Ã£ Ä‘Æ°á»£c náº¡p cho há»£p Ä‘á»“ng kiá»ƒm tra app mobile',
    },
    description: {
      en: 'A new client deposited the first milestone amount to begin security review work.',
      vi: 'KhÃ¡ch hÃ ng má»›i Ä‘Ã£ ná»™p tiá»n milestone Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u quÃ¡ trÃ¬nh Ä‘Ã¡nh giÃ¡ báº£o máº­t.',
    },
    time: { en: '5 hours ago', vi: '5 giá» trÆ°á»›c' },
    icon: Landmark,
  },
  {
    title: {
      en: 'Contract updated with delivery notes',
      vi: 'Há»£p Ä‘á»“ng Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t vá»›i ghi chÃº bÃ n giao',
    },
    description: {
      en: 'The product copy contract now includes revised scope details and protection terms.',
      vi: 'Há»£p Ä‘á»“ng Ä‘Ã£ bá»• sung pháº¡m vi cÃ´ng viá»‡c má»›i vÃ  cÃ¡c Ä‘iá»u khoáº£n báº£o vá»‡.',
    },
    time: { en: 'Yesterday', vi: 'HÃ´m qua' },
    icon: ClipboardList,
  },
];

export const jobs = [
  {
    title: {
      en: 'Fintech dashboard redesign with escrow milestones',
      vi: 'Thiáº¿t káº¿ láº¡i dashboard fintech theo milestone escrow',
    },
    budget: '$3,500 - $5,000',
    client: 'Northstar Capital',
    category: { en: 'Design', vi: 'Thiáº¿t káº¿' },
    description: {
      en: 'Looking for a senior product designer to modernize a compliance-heavy dashboard experience.',
      vi: 'TÃ¬m product designer cáº¥p cao Ä‘á»ƒ hiá»‡n Ä‘áº¡i hÃ³a dashboard cÃ³ nhiá»u yÃªu cáº§u tuÃ¢n thá»§.',
    },
    assignedFreelancerName: 'Ariana Lee',
    assignedFreelancerRole: 'freelancer',
  },
  {
    title: {
      en: 'React frontend for trust verification portal',
      vi: 'Frontend React cho cá»•ng thÃ´ng tin xÃ¡c minh uy tÃ­n',
    },
    budget: '$4,200',
    client: 'SecureFlow Labs',
    category: { en: 'Development', vi: 'PhÃ¡t triá»ƒn' },
    description: {
      en: 'Build a responsive portal for identity checks, contract evidence, and payout controls.',
      vi: 'XÃ¢y dá»±ng cá»•ng thÃ´ng tin responsive cho xÃ¡c minh danh tÃ­nh, báº±ng chá»©ng há»£p Ä‘á»“ng vÃ  kiá»ƒm soÃ¡t thanh toÃ¡n.',
    },
    assignedFreelancerName: 'Marcus Nguyen',
    assignedFreelancerRole: 'freelancer',
  },
  {
    title: {
      en: 'Platform security audit for freelance marketplace',
      vi: 'ÄÃ¡nh giÃ¡ báº£o máº­t ná»n táº£ng marketplace freelance',
    },
    budget: '$6,000',
    client: 'Helix Networks',
    category: { en: 'Security', vi: 'Báº£o máº­t' },
    description: {
      en: 'Review web app security posture, transaction protection, and file delivery risk.',
      vi: 'ÄÃ¡nh giÃ¡ báº£o máº­t á»©ng dá»¥ng web, cÆ¡ cháº¿ báº£o vá»‡ giao dá»‹ch vÃ  rá»§i ro khi bÃ n giao tá»‡p.',
    },
  },
  {
    title: {
      en: 'Dispute policy and contract language refresh',
      vi: 'Cáº­p nháº­t chÃ­nh sÃ¡ch tranh cháº¥p vÃ  ngÃ´n ngá»¯ há»£p Ä‘á»“ng',
    },
    budget: '$1,800',
    client: 'Bridge Legal',
    category: { en: 'Legal', vi: 'PhÃ¡p lÃ½' },
    description: {
      en: 'Refine contract templates and approval workflows for dispute-prevention clarity.',
      vi: 'Tá»‘i Æ°u máº«u há»£p Ä‘á»“ng vÃ  quy trÃ¬nh phÃª duyá»‡t Ä‘á»ƒ giáº£m tranh cháº¥p.',
    },
  },
];

export const contracts = [
  {
    id: 1,
    initials: 'AC',
    title: { en: 'Mobile App UI Design', vi: 'Thiáº¿t káº¿ UI á»©ng dá»¥ng di Ä‘á»™ng' },
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
        title: { en: 'Wireframes & User Flows', vi: 'Wireframe vÃ  luá»“ng ngÆ°á»i dÃ¹ng' },
        dueDate: 'Mar 10',
        amount: '$800',
        status: 'Approved',
        action: null,
        reviewAction: 'View Product',
        reviewNote: 'Approved deliverables remain available for review.',
      },
      {
        title: { en: 'High-Fidelity Mockups', vi: 'Mockup chi tiáº¿t' },
        dueDate: 'Mar 25',
        amount: '$1,600',
        status: 'Completed',
        action: 'Approve',
        reviewAction: 'Review Product',
        reviewNote: 'Ready for product review and payout approval.',
      },
      {
        title: { en: 'Prototype & Animations', vi: 'Prototype vÃ  animation' },
        dueDate: 'Apr 5',
        amount: '$1,200',
        status: 'In Progress',
        action: 'Submit Work',
        reviewAction: 'View Draft',
        reviewNote: 'Latest working build is visible before final submission.',
      },
      {
        title: { en: 'Handoff & Documentation', vi: 'BÃ n giao vÃ  tÃ i liá»‡u' },
        dueDate: 'Apr 15',
        amount: '$600',
        status: 'Pending',
        action: null,
        reviewAction: null,
        reviewNote: 'Assets will appear here once this milestone begins.',
      },
    ],
  },
  {
    id: 2,
    initials: 'SX',
    title: { en: 'Brand Identity Package', vi: 'GÃ³i nháº­n diá»‡n thÆ°Æ¡ng hiá»‡u' },
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
        title: { en: 'Brand Discovery', vi: 'KhÃ¡m phÃ¡ thÆ°Æ¡ng hiá»‡u' },
        dueDate: 'Feb 8',
        amount: '$500',
        status: 'Approved',
        action: null,
        reviewAction: 'View Product',
        reviewNote: 'Discovery notes and approved workshop output are available.',
      },
      {
        title: { en: 'Logo Concepts', vi: 'Ã tÆ°á»Ÿng logo' },
        dueDate: 'Feb 18',
        amount: '$900',
        status: 'Approved',
        action: null,
        reviewAction: 'View Product',
        reviewNote: 'Approved logo explorations are archived for reference.',
      },
      {
        title: { en: 'Final Brand Kit', vi: 'Bá»™ nháº­n diá»‡n cuá»‘i cÃ¹ng' },
        dueDate: 'Mar 2',
        amount: '$800',
        status: 'Completed',
        action: null,
        reviewAction: 'Review Product',
        reviewNote: 'Final brand package is ready for final review.',
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

export const disputes = [
  {
    id: 1,
    title: { en: 'Prototype delivery dispute', vi: 'Tranh chap ban giao prototype' },
    contract: { en: 'Mobile App UI Design', vi: 'Thiet ke UI ung dung di dong' },
    client: 'Acme Corp',
    amount: '$1,200',
    status: 'Under Review',
    openedAt: 'Apr 7, 2026',
    summary: {
      en: 'Client requested additional revisions before approving the prototype milestone payout.',
      vi: 'Khach hang yeu cau chinh sua them truoc khi phe duyet thanh toan milestone prototype.',
    },
    timeline: [
      { label: 'Dispute opened', date: 'Apr 7, 2026', note: 'Client flagged delivery scope mismatch.' },
      { label: 'Evidence submitted', date: 'Apr 8, 2026', note: 'Freelancer uploaded annotated prototype links and approval notes.' },
      { label: 'Platform review', date: 'Apr 9, 2026', note: 'Moderator is reviewing milestone scope and communication history.' },
    ],
  },
  {
    id: 2,
    title: { en: 'Final brand kit revision request', vi: 'Tranh chap yeu cau chinh sua brand kit' },
    contract: { en: 'Brand Identity Package', vi: 'Goi nhan dien thuong hieu' },
    client: 'StartupXYZ',
    amount: '$800',
    status: 'Resolved',
    openedAt: 'Mar 3, 2026',
    summary: {
      en: 'Final files were updated and the remaining payout was released after moderator confirmation.',
      vi: 'Bo file cuoi cung da duoc cap nhat va khoan thanh toan con lai da duoc giai phong sau khi moderator xac nhan.',
    },
    timeline: [
      { label: 'Dispute opened', date: 'Mar 3, 2026', note: 'Client requested source file adjustments.' },
      { label: 'Revision delivered', date: 'Mar 4, 2026', note: 'Freelancer submitted corrected exports and editable assets.' },
      { label: 'Resolved', date: 'Mar 5, 2026', note: 'Client confirmed deliverables and escrow was released.' },
    ],
  },
];

export const freelancerProfiles = [
  {
    id: 'ariana-lee',
    fullName: 'Ariana Lee',
    headline: 'Senior Product Designer for SaaS, escrow, and trust workflows',
    specialty: 'Product Design',
    location: 'Singapore',
    hourlyRate: '$68/hr',
    availability: 'Available in 3 days',
    rating: 4.9,
    completedJobs: 38,
    completionRate: '98%',
    responseTime: '1 hour',
    escrowSuccessRate: '100%',
    totalEarnings: '$124k',
    activeContracts: 3,
    intro: 'I design high-conviction product experiences for fintech, B2B SaaS, and marketplace platforms. My focus is turning complex payment, trust, and dispute flows into interfaces clients can approve quickly and users can understand instantly.',
    skills: ['Product Strategy', 'UX Research', 'Design Systems', 'Figma', 'Interaction Design', 'Escrow UX'],
    trustBadges: ['Identity verified', 'Escrow-ready delivery', 'Top-rated communication'],
    highlights: [
      'Built milestone approval flows for regulated fintech products.',
      'Improved design-to-dev handoff speed with structured component systems.',
      'Comfortable leading discovery, wireframes, high-fidelity UI, and product reviews.',
    ],
    portfolio: [
      {
        title: 'Freelancer Protection Platform Redesign',
        category: 'Marketplace Product',
        summary: 'Redesigned escrow, dispute, and milestone review journeys for a freelance trust platform.',
        outcome: 'Reduced approval friction by 31% and improved milestone completion clarity for clients.',
        tools: 'Figma, FigJam, Notion',
      },
      {
        title: 'B2B Finance Dashboard System',
        category: 'SaaS Dashboard',
        summary: 'Created a modular dashboard and audit review system for a compliance-heavy finance team.',
        outcome: 'Cut design QA cycles from 5 rounds to 2 with stronger component governance.',
        tools: 'Figma, Storybook, Maze',
      },
      {
        title: 'Mobile Prototype for Client Approvals',
        category: 'Mobile App',
        summary: 'Delivered clickable prototypes for client approvals, release gates, and payout checkpoints.',
        outcome: 'Helped stakeholders approve milestone releases faster across design sprints.',
        tools: 'Figma, ProtoPie',
      },
    ],
    experience: [
      {
        role: 'Lead Product Designer',
        company: 'Northstar Studio',
        period: '2023 - Present',
        summary: 'Leading product design for fintech and trust-centered platforms with a focus on approval flows and operations tooling.',
      },
      {
        role: 'Senior UX Designer',
        company: 'Flux Payments',
        period: '2020 - 2023',
        summary: 'Designed payment release dashboards, verification journeys, and internal risk review surfaces.',
      },
    ],
    reviews: [
      {
        client: 'Acme Corp',
        project: 'Mobile App UI Design',
        rating: 5,
        text: 'Ariana made a complex approval workflow feel clear and premium. We moved faster because every milestone was easy to review.',
      },
      {
        client: 'BrightSide Studio',
        project: 'Dashboard System Refresh',
        rating: 5,
        text: 'Strong product thinking, clean handoff, and excellent communication throughout revisions and milestone reviews.',
      },
    ],
  },
  {
    id: 'marcus-nguyen',
    fullName: 'Marcus Nguyen',
    headline: 'React engineer for client portals, dashboards, and secure web apps',
    specialty: 'Frontend Development',
    location: 'Ho Chi Minh City',
    hourlyRate: '$54/hr',
    availability: 'Available now',
    rating: 4.8,
    completedJobs: 27,
    completionRate: '96%',
    responseTime: '45 mins',
    escrowSuccessRate: '97%',
    totalEarnings: '$92k',
    activeContracts: 2,
    intro: 'I build responsive React applications for platforms that need reliability, speed, and maintainable code. Most of my recent work has been around internal tools, client dashboards, trust portals, and payment-related product surfaces.',
    skills: ['React', 'Tailwind CSS', 'Node.js', 'TypeScript', 'Vite', 'Dashboard UX'],
    trustBadges: ['Code quality reviewed', 'Fast responder', 'Strong delivery record'],
    highlights: [
      'Ships production-ready dashboard interfaces with reusable component systems.',
      'Comfortable owning full frontend implementation from API wiring to polish.',
      'Experienced with role-based portals and protected payment flows.',
    ],
    portfolio: [
      {
        title: 'Protected Payments Admin Console',
        category: 'Operations Dashboard',
        summary: 'Built a role-based admin console for disputes, payouts, and moderation workflows.',
        outcome: 'Enabled internal teams to resolve payout issues with clearer action states and faster triage.',
        tools: 'React, Tailwind, Express',
      },
      {
        title: 'Client Review Workspace',
        category: 'Portal Experience',
        summary: 'Implemented milestone review pages, file previews, and approval actions for enterprise clients.',
        outcome: 'Improved review completion and reduced support hand-holding during project delivery.',
        tools: 'React, Node.js, MongoDB',
      },
    ],
    experience: [
      {
        role: 'Senior Frontend Engineer',
        company: 'Trust Harbor',
        period: '2022 - Present',
        summary: 'Owning frontend systems for payment controls, user verification, and contract operations.',
      },
      {
        role: 'Frontend Developer',
        company: 'Orbit Labs',
        period: '2019 - 2022',
        summary: 'Built SaaS dashboards and shipping-focused UI for workflow-heavy teams.',
      },
    ],
    reviews: [
      {
        client: 'SecureFlow Labs',
        project: 'Verification Portal Frontend',
        rating: 5,
        text: 'Marcus delivered a polished frontend fast and stayed reliable through API changes and final QA.',
      },
      {
        client: 'Bridge Legal',
        project: 'Internal Review Dashboard',
        rating: 4,
        text: 'Very strong implementation partner with thoughtful suggestions around role permissions and usability.',
      },
    ],
  },
];

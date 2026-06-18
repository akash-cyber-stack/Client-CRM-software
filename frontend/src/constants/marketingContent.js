export const TRIAL_DAYS = 10;
export const TRIAL_HEADLINE = '10-day free trial · No credit card';

export const MARKETING_STATS = [
  { value: '10 days', label: 'Full workspace trial' },
  { value: 'Flat ₹', label: 'Workspace pricing — not per seat' },
  { value: '3×', label: 'Faster first response' },
  { value: '24/7', label: 'Webhook lead intake' },
];

export const PLAN_EXCLUSIVE_FEATURES = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '₹1,299/mo',
    tag: 'Trial includes this',
    headline: 'Pipeline discipline without IVR overhead',
    exclusives: [
      'Lead Vault + Kanban with Pulse score',
      'Follow-up Radar with urgency badges',
      'Round-robin assignment',
      'Up to 5 users · 500 leads',
      'Command palette (⌘K)',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '₹3,299/mo',
    tag: 'Most teams upgrade here',
    popular: true,
    headline: 'Ads + calls in one timeline',
    exclusives: [
      'Call Bridge — IVR click-to-call & recordings',
      'Insight Studio reports + CSV export',
      'Email alert engine (assign, broadcast, reports)',
      'Full automation pack',
      'Up to 25 users · unlimited leads',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '₹5,999/mo',
    tag: 'Unlimited scale',
    headline: 'AI ops for multi-manager floors',
    exclusives: [
      'AI Advisor missions on Command Center',
      'Unlimited users & priority support',
      'Custom webhook fields',
      'Advanced analytics layer',
      'Everything in Professional',
    ],
  },
];

/** Honest positioning vs spreadsheets and SIM-first dialer CRMs */
export const WHY_US_COMPARE = [
  {
    label: 'Google & Meta form webhooks',
    us: 'Built-in',
    sheets: 'Manual export',
    dialer: 'Often add-on',
  },
  {
    label: 'Pricing model',
    us: 'Flat workspace / month',
    sheets: 'Free but hidden labour',
    dialer: 'Per user / month',
  },
  {
    label: 'IVR click-to-call',
    us: 'Your IVR provider',
    sheets: '—',
    dialer: 'SIM / mobile app',
  },
  {
    label: 'Lead Pulse scoring',
    us: '✓',
    sheets: '—',
    dialer: 'Varies',
  },
  {
    label: 'Email OTP login',
    us: '✓ — no SMS fees',
    sheets: '—',
    dialer: 'SMS OTP common',
  },
  {
    label: 'Free trial',
    us: '10 days · no card',
    sheets: '—',
    dialer: '10 days typical',
  },
  {
    label: 'Razorpay INR billing',
    us: '✓',
    sheets: '—',
    dialer: '✓',
  },
];

export const MOBILE_WEB_POINTS = [
  {
    title: 'Works on any phone browser',
    text: 'Reps open Lead Vault and Follow-up Radar from Chrome — no separate app install required.',
  },
  {
    title: 'Same login as desktop',
    text: 'Managers and closers see one pipeline whether they are on the floor or on the road.',
  },
  {
    title: 'Native app roadmap',
    text: 'We are building a Play Store app — until then, the web desk is fully responsive for field teams.',
  },
];

export const HOME_PROBLEM_POINTS = [
  {
    title: 'Leads land in five different places',
    text: 'Meta Business Suite, Google Sheets, manager inboxes — reps never know which list is current.',
  },
  {
    title: 'Follow-ups depend on memory',
    text: 'Sticky notes and WhatsApp reminders fail the moment one person is on leave.',
  },
  {
    title: 'Calls happen outside the CRM',
    text: 'Dialer apps don’t talk to your pipeline, so managers can’t coach from real data.',
  },
];

export const HOME_WORKFLOW = [
  {
    title: 'Webhook catches the lead',
    text: 'Google Ads or Meta pushes the form fill into Lead Vault within seconds.',
  },
  {
    title: 'Round-robin assigns a owner',
    text: 'No more “who’s taking this?” in the group chat — the desk stays fair.',
  },
  {
    title: 'Rep calls from the profile',
    text: 'IVR click-to-call logs duration, status, and recording against the same lead.',
  },
  {
    title: 'Radar surfaces what’s due',
    text: 'Follow-up Radar ranks today, pending, and missed — before the deal goes cold.',
  },
];

export const HOME_TESTIMONIAL = {
  quote:
    'We stopped losing Meta leads on weekends. Everyone sees the same pipeline now — even our part-time closers.',
  name: 'Operations lead',
  role: '12-person ed-tech sales team, Pune',
};

export const MARKETING_FEATURES = [
  {
    slug: 'webhook-intake',
    category: 'Intake',
    title: 'Google & Meta webhooks',
    desc: 'Paste one URL per ad account. Form fills become leads with campaign, ad set, and form name attached.',
    detail:
      'Stop copying CSV exports. Each webhook hit creates a lead with source metadata so you know which creative drove the inquiry.',
  },
  {
    slug: 'lead-pulse',
    category: 'Pipeline',
    title: 'Lead Pulse score',
    desc: 'Hot, warm, and cold badges from status, follow-up date, source, and age — reps sort reality, not guesses.',
    detail:
      'Pulse weighs pipeline stage, overdue follow-ups, unassigned state, and ad-source priority into a 0–100 score visible in table and Kanban.',
  },
  {
    slug: 'round-robin',
    category: 'Pipeline',
    title: 'Round-robin assignment',
    desc: 'Fair rotation across active sales employees. Toggle manual assign when managers want control.',
    detail:
      'Configure in Control Room. Webhook leads and manual imports can auto-route without ops babysitting a spreadsheet.',
  },
  {
    slug: 'ivr-calls',
    category: 'Calls',
    title: 'IVR click-to-call',
    desc: 'Dial from the lead profile. Completion webhooks attach recordings and call status to the timeline.',
    detail:
      'Professional plan and above. Reps stay inside the CRM; managers audit call history without asking for screenshots.',
  },
  {
    slug: 'follow-up-radar',
    category: 'Tasks',
    title: 'Follow-up Radar',
    desc: 'Today, pending, and missed tabs with urgency labels — overdue items surface before they hurt revenue.',
    detail:
      'Automation can nudge reps when follow-ups slip. Managers see counts on the Command Center signal band.',
  },
  {
    slug: 'email-alerts',
    category: 'Comms',
    title: 'Email alert engine',
    desc: 'HTML emails when leads assign, admins broadcast notices, or reports are shared with the team.',
    detail:
      'Available on Professional and Enterprise. Uses your workspace SMTP — professional templates, inbox delivery.',
  },
  {
    slug: 'ai-advisor',
    category: 'Enterprise',
    title: 'AI Advisor missions',
    desc: 'Health score and suggested actions for ops leads — what to fix before the month ends.',
    detail:
      'Enterprise plan. Surfaces stale leads, missed follow-ups, and team load in a single command view.',
  },
  {
    slug: 'insight-studio',
    category: 'Analytics',
    title: 'Insight Studio reports',
    desc: 'Employee, campaign, call, and conversion reports with CSV export and email share.',
    detail:
      'Filter by date and source. Email a snapshot to managers without exporting and re-uploading to Slack.',
  },
  {
    slug: 'command-palette',
    category: 'Productivity',
    title: 'Command palette (⌘K)',
    desc: 'Jump to leads, follow-ups, reports, or settings from anywhere — keyboard-first for power users.',
    detail:
      'Press Ctrl+K (or click ⌘K in the navbar). Plan-gated routes hide automatically on Starter.',
  },
  {
    slug: 'kanban',
    category: 'Pipeline',
    title: 'Kanban pipeline view',
    desc: 'Status columns with Pulse badges — see pipeline shape without building a separate board tool.',
    detail:
      'Toggle Table/Kanban in Lead Vault. Same filters apply; cards link straight to lead detail.',
  },
  {
    slug: 'email-otp',
    category: 'Security',
    title: 'Email OTP sign-in',
    desc: 'Verify workspace access via inbox OTP — no SMS vendor lock-in or per-message fees.',
    detail:
      'Gmail App Password or SMTP provider. Registration and sign-in stay secure without phone OTP costs.',
  },
  {
    slug: 'razorpay',
    category: 'Billing',
    title: 'Razorpay checkout',
    desc: 'UPI, cards, netbanking, and wallets — INR subscriptions native to how Indian teams already pay.',
    detail:
      'Super Admin completes checkout during workspace creation or upgrades from Control Room → Subscription.',
  },
];

export const FEATURE_CATEGORIES = ['Intake', 'Pipeline', 'Calls', 'Tasks', 'Comms', 'Analytics', 'Enterprise', 'Productivity', 'Security', 'Billing'];

export const MARKETING_MODULES = [
  {
    id: 'dashboard',
    name: 'Command Center',
    tag: 'Dashboard',
    summary: 'Morning briefing for leads, calls, and follow-ups.',
    points: ['Live KPI tiles', '7-day intake trend', 'Signal band metrics', 'Command dock shortcuts', 'Enterprise AI missions'],
    forWho: 'Managers and reps who need one screen before the stand-up.',
  },
  {
    id: 'leads',
    name: 'Lead Vault',
    tag: 'Leads',
    summary: 'Every inquiry — ads, imports, manual — in one searchable vault.',
    points: ['Table + Kanban', 'Pulse score', 'Bulk CSV/Excel import', 'Notes & activity timeline', 'Bulk delete'],
    forWho: 'Anyone touching the pipeline daily.',
  },
  {
    id: 'calls',
    name: 'Call Bridge',
    tag: 'IVR',
    summary: 'Outbound calls and recordings tied to the lead — not a separate dialer log.',
    points: ['Click-to-call', 'Recording playback', 'Filter by rep/status', 'Per-lead call history'],
    forWho: 'Inside sales teams on Professional plan or above.',
  },
  {
    id: 'followups',
    name: 'Follow-up Radar',
    tag: 'Tasks',
    summary: 'Due dates that actually get completed — ranked by urgency.',
    points: ['Today / pending / missed', 'Urgency badges', 'One-tap complete', 'Automation reminders'],
    forWho: 'Reps with 20+ active conversations.',
  },
  {
    id: 'reports',
    name: 'Insight Studio',
    tag: 'Reports',
    summary: 'Campaign and rep performance without exporting to Excel every Friday.',
    points: ['Employee leaderboard', 'Campaign breakdown', 'Conversion funnel', 'CSV export', 'Email share'],
    forWho: 'Managers reviewing ROI on ad spend.',
  },
  {
    id: 'employees',
    name: 'Team Grid',
    tag: 'People',
    summary: 'Seat limits, roles, IVR IDs, and performance drill-down.',
    points: ['Role-based access', 'Bulk import', 'IVR agent mapping', 'Performance page per rep'],
    forWho: 'Admins scaling the floor past five people.',
  },
  {
    id: 'settings',
    name: 'Control Room',
    tag: 'Settings',
    summary: 'Webhooks, automation toggles, billing, and team notices.',
    points: ['Google/Meta webhook keys', 'Assignment method', 'Automation switches', 'Razorpay upgrade', 'Team broadcast'],
    forWho: 'Super Admins and ops owners.',
  },
];

export const MARKETING_PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '₹1,299',
    period: '/month',
    trialNote: '10-day free trial on signup',
    bestFor: 'Small inside-sales teams testing structured follow-ups.',
    features: ['Up to 5 users', '500 leads', 'Command Center + Lead Vault', 'Follow-up Radar', 'In-app notifications'],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '₹3,299',
    period: '/month',
    trialNote: '10-day free trial on signup',
    popular: true,
    bestFor: 'Growing teams running ads + IVR daily.',
    features: [
      'Up to 25 users',
      'Unlimited leads',
      'Call Bridge + IVR',
      'Insight Studio reports',
      'Email alerts',
      'Full automation pack',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '₹5,999',
    period: '/month',
    trialNote: '10-day free trial on signup',
    bestFor: 'Multi-manager floors needing AI ops and unlimited seats.',
    features: [
      'Unlimited users',
      'AI Advisor on dashboard',
      'Priority support tier',
      'Custom webhooks',
      'Advanced analytics',
      'Email alerts',
    ],
  },
];

export const PRICING_COMPARE = [
  { label: 'Users', starter: '5', pro: '25', ent: 'Unlimited' },
  { label: 'Leads', starter: '500', pro: 'Unlimited', ent: 'Unlimited' },
  { label: 'IVR / calls', starter: '—', pro: '✓', ent: '✓' },
  { label: 'Reports', starter: '—', pro: '✓', ent: '✓' },
  { label: 'Email alerts', starter: '—', pro: '✓', ent: '✓' },
  { label: 'AI Advisor', starter: '—', pro: '—', ent: '✓' },
];

export const MARKETING_FAQ = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every new workspace gets a 10-day full trial. No credit card required at signup. After the trial, pay via Razorpay to keep access.',
  },
  {
    q: 'Is Sales Lead CRM built for Indian businesses?',
    a: 'Yes. Billing is in INR via Razorpay (UPI, cards, netbanking). Workspaces support Indian phone formats, and email OTP avoids international SMS costs.',
  },
  {
    q: 'How do Google Ads and Meta leads enter the CRM?',
    a: 'Copy the webhook URL from Control Room → Integrations into your ad platform. Each form submission creates a lead with campaign metadata automatically.',
  },
  {
    q: 'Do I need a separate SMS provider for login?',
    a: 'No. Sign-in and registration use email OTP through your SMTP (e.g. Gmail App Password). Phone numbers are stored for contact only.',
  },
  {
    q: 'Can I import existing leads from Excel?',
    a: 'Yes. Lead Vault supports CSV and Excel bulk import with duplicate-phone skipping. All imports are tagged as Manual source.',
  },
  {
    q: 'What is Lead Pulse?',
    a: 'A 0–100 priority score shown on each lead. It considers status, follow-up due date, assignment, source, and age so reps focus on deals likely to close.',
  },
  {
    q: 'Does the CRM support IVR click-to-call?',
    a: 'On Professional and Enterprise plans. Reps call from the lead profile; your IVR provider sends completion webhooks with status and recording URL.',
  },
  {
    q: 'Can managers see employee performance?',
    a: 'Yes. Insight Studio includes employee reports, daily/monthly stats, and CSV export. Team Grid links to per-rep performance pages.',
  },
  {
    q: 'How does round-robin assignment work?',
    a: 'Active sales employees rotate automatically on new webhook or unassigned leads. Switch to manual assignment in Control Room when needed.',
  },
  {
    q: 'Can I upgrade or change plans later?',
    a: 'Super Admins upgrade from Control Room → Subscription. Razorpay handles checkout; your workspace keeps existing data.',
  },
  {
    q: 'Is my data isolated from other companies?',
    a: 'Every workspace is multi-tenant isolated by company ID. Users only see leads, calls, and settings for their own organization.',
  },
  {
    q: 'What automation alerts are included?',
    a: 'Missed follow-up nudges, stale lead warnings, unassigned lead alerts, and follow-up reminders — configurable in Control Room.',
  },
  {
    q: 'How fast can we go live?',
    a: 'Most teams create a workspace, connect one webhook, and import reps within a day. Email OTP and Razorpay are the only external setup steps.',
  },
];

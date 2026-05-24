const BENEFITS = [
  'Lead capture from Google Ads, Meta & manual entry',
  'Assign leads to sales teams — round-robin or bulk import',
  'Call history, IVR recordings & follow-up reminders',
  'Role-based access for Admin, Manager & Sales',
  'Dashboards, reports & employee performance tracking',
];

function MockStat({ label, value, color }) {
  return (
    <div className="auth-mock-stat">
      <p className="auth-mock-stat-label">{label}</p>
      <p className={`auth-mock-stat-value ${color}`}>{value}</p>
    </div>
  );
}

export default function AuthMarketingPanel({ onGetStarted }) {
  return (
    <div className="auth-marketing hidden lg:flex flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
      <div className="auth-marketing-glow auth-marketing-glow-a" />
      <div className="auth-marketing-glow auth-marketing-glow-b" />

      <div className="relative z-10 max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-300 mb-4">
          Sales Lead CRM
        </p>
        <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
          Run your entire sales pipeline in one place.
        </h2>
        <p className="text-slate-300 text-base leading-relaxed mb-8">
          No credit card required to get started. Set up in minutes and give your team a clear view of
          every lead, call, and follow-up.
        </p>

        <p className="text-sm font-medium text-slate-200 mb-4">With your CRM workspace you get:</p>
        <ul className="space-y-3 mb-10">
          {BENEFITS.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-slate-200">
              <span className="auth-check-icon shrink-0" aria-hidden>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onGetStarted} className="auth-cta-btn">
          Create free account
        </button>
      </div>

      <div className="relative z-10 mt-10 auth-mock-dashboard">
        <div className="auth-mock-dashboard-header">
          <span className="auth-mock-dot bg-red-400" />
          <span className="auth-mock-dot bg-amber-400" />
          <span className="auth-mock-dot bg-emerald-400" />
          <span className="text-xs text-slate-400 ml-2">Dashboard preview</span>
        </div>
        <div className="auth-mock-dashboard-body">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MockStat label="Total Leads" value="248" color="text-blue-400" />
            <MockStat label="Converted" value="42" color="text-emerald-400" />
            <MockStat label="Follow-ups" value="18" color="text-amber-400" />
            <MockStat label="Calls today" value="36" color="text-violet-400" />
          </div>
          <div className="auth-mock-chart">
            <div className="auth-mock-bar" style={{ height: '45%' }} />
            <div className="auth-mock-bar" style={{ height: '70%' }} />
            <div className="auth-mock-bar" style={{ height: '55%' }} />
            <div className="auth-mock-bar" style={{ height: '90%' }} />
            <div className="auth-mock-bar" style={{ height: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

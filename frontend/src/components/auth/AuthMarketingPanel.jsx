import AuthPipelineShowcase from './AuthPipelineShowcase';

const BENEFITS = [
  'Lead capture from Google Ads, Meta & manual entry',
  'Assign leads to sales teams — round-robin or bulk import',
  'Call history, IVR recordings & follow-up reminders',
  'Role-based access for Admin, Manager & Sales',
  'Dashboards, reports & employee performance tracking',
];

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

      <div className="relative z-10 mt-8">
        <AuthPipelineShowcase />
      </div>
    </div>
  );
}

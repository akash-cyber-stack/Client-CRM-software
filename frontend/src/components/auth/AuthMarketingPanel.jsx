import AuthAuroraVisual from './AuthAuroraVisual';

const PILLARS = [
  { icon: '⚡', title: 'Capture', text: 'Ads, Meta & manual leads' },
  { icon: '◎', title: 'Assign', text: 'Round-robin or bulk import' },
  { icon: '☎', title: 'Connect', text: 'IVR, calls & follow-ups' },
  { icon: '◈', title: 'Control', text: 'Roles for every team member' },
];

export default function AuthMarketingPanel({ onGetStarted }) {
  return (
    <div className="auth-marketing hidden lg:flex relative overflow-hidden">
      <AuthAuroraVisual />

      <div className="auth-marketing-scrim" />

      <div className="auth-marketing-content relative z-10 flex flex-col justify-between p-10 xl:p-14 min-h-full w-full">
        <div>
          <p className="auth-marketing-eyebrow">Sales Lead CRM</p>
          <h2 className="auth-marketing-headline">
            Clarity for every
            <span className="auth-marketing-headline-accent"> conversation.</span>
          </h2>
          <p className="auth-marketing-lead">
            Built for sales teams who want focus — not another cluttered screen. Sign in and get to
            work in seconds.
          </p>
        </div>

        <div>
          <div className="auth-pillar-grid">
            {PILLARS.map((p) => (
              <div key={p.title} className="auth-pillar">
                <span className="auth-pillar-icon" aria-hidden>
                  {p.icon}
                </span>
                <div>
                  <p className="auth-pillar-title">{p.title}</p>
                  <p className="auth-pillar-text">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={onGetStarted} className="auth-cta-btn auth-cta-btn-wide mt-8">
            Create free account
          </button>

          <p className="auth-marketing-footnote mt-6">
            Free to start · No credit card · Your data stays in your workspace
          </p>
        </div>
      </div>
    </div>
  );
}

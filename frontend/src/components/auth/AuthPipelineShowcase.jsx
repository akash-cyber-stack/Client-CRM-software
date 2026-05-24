const PIPELINE_STAGES = [
  { label: 'New', pct: 72, color: '#60a5fa' },
  { label: 'Active', pct: 48, color: '#a78bfa' },
  { label: 'Won', pct: 28, color: '#34d399' },
];

const FLOATING_LEADS = [
  { name: 'Priya S.', source: 'Google Ads', status: 'Hot', statusLabel: 'Hot', delay: '0s' },
  { name: 'Rahul M.', source: 'Meta Lead', status: 'Followup', statusLabel: 'Follow-up', delay: '0.4s' },
  { name: 'Anita K.', source: 'IVR Call', status: 'Converted', statusLabel: 'Converted', delay: '0.8s' },
];

const ACTIVITY = [
  { time: 'Just now', text: 'Lead assigned to Sales Team A' },
  { time: '2m ago', text: 'IVR recording linked — 4:32' },
  { time: '5m ago', text: 'Follow-up scheduled for tomorrow' },
];

function PipelineRing() {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="auth-showcase-ring-wrap">
      <svg viewBox="0 0 128 128" className="auth-showcase-ring-svg" aria-hidden>
        <defs>
          <linearGradient id="auth-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#auth-ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * 0.22}
          className="auth-showcase-ring-progress"
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="auth-showcase-ring-center">
        <span className="auth-showcase-ring-value">84%</span>
        <span className="auth-showcase-ring-label">Pipeline health</span>
      </div>
    </div>
  );
}

export default function AuthPipelineShowcase() {
  return (
    <div className="auth-showcase" aria-hidden>
      <div className="auth-showcase-orbit auth-showcase-orbit-1" />
      <div className="auth-showcase-orbit auth-showcase-orbit-2" />

      <div className="auth-showcase-shell">
        <header className="auth-showcase-header">
          <div className="auth-showcase-header-left">
            <span className="auth-showcase-live-dot" />
            <span className="auth-showcase-header-title">Live workspace</span>
          </div>
          <span className="auth-showcase-header-badge">12 agents online</span>
        </header>

        <div className="auth-showcase-body">
          <div className="auth-showcase-col auth-showcase-col-ring">
            <PipelineRing />
            <ul className="auth-showcase-stages">
              {PIPELINE_STAGES.map((s) => (
                <li key={s.label} className="auth-showcase-stage">
                  <span className="auth-showcase-stage-dot" style={{ background: s.color }} />
                  <span className="auth-showcase-stage-label">{s.label}</span>
                  <span className="auth-showcase-stage-bar">
                    <span
                      className="auth-showcase-stage-fill"
                      style={{ '--stage-w': `${s.pct}%`, background: s.color }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-showcase-col auth-showcase-col-leads">
            <p className="auth-showcase-col-title">Incoming leads</p>
            <div className="auth-showcase-leads-stack">
              {FLOATING_LEADS.map((lead) => (
                <article
                  key={lead.name}
                  className="auth-showcase-lead-card"
                  style={{ animationDelay: lead.delay }}
                >
                  <div className="auth-showcase-lead-avatar">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="auth-showcase-lead-meta">
                    <p className="auth-showcase-lead-name">{lead.name}</p>
                    <p className="auth-showcase-lead-source">{lead.source}</p>
                  </div>
                  <span className={`auth-showcase-lead-badge auth-showcase-badge-${lead.status}`}>
                    {lead.statusLabel}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="auth-showcase-col auth-showcase-col-feed">
            <p className="auth-showcase-col-title">Activity stream</p>
            <ul className="auth-showcase-feed">
              {ACTIVITY.map((item, i) => (
                <li
                  key={item.text}
                  className="auth-showcase-feed-item"
                  style={{ animationDelay: `${0.2 + i * 0.35}s` }}
                >
                  <span className="auth-showcase-feed-time">{item.time}</span>
                  <p className="auth-showcase-feed-text">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="auth-showcase-footer">
          <div className="auth-showcase-metrics">
            <div>
              <span className="auth-showcase-metric-val">+127</span>
              <span className="auth-showcase-metric-lbl">Leads this week</span>
            </div>
            <div>
              <span className="auth-showcase-metric-val text-emerald-400">38%</span>
              <span className="auth-showcase-metric-lbl">Conversion</span>
            </div>
            <div>
              <span className="auth-showcase-metric-val text-cyan-400">2.4m</span>
              <span className="auth-showcase-metric-lbl">Avg response</span>
            </div>
          </div>
          <svg viewBox="0 0 200 40" className="auth-showcase-sparkline" preserveAspectRatio="none">
            <defs>
              <linearGradient id="auth-spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(59,130,246,0.45)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0)" />
              </linearGradient>
            </defs>
            <path
              className="auth-showcase-spark-area"
              d="M0,32 L20,28 L40,30 L60,18 L80,22 L100,12 L120,16 L140,8 L160,14 L180,6 L200,10 L200,40 L0,40 Z"
              fill="url(#auth-spark-fill)"
            />
            <path
              className="auth-showcase-spark-line"
              d="M0,32 L20,28 L40,30 L60,18 L80,22 L100,12 L120,16 L140,8 L160,14 L180,6 L200,10"
              fill="none"
              stroke="url(#auth-ring-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </footer>
      </div>
    </div>
  );
}

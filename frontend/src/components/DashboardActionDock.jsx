import { useNavigate } from 'react-router-dom';

export default function DashboardActionDock({ data, isAdmin }) {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'leads',
      title: 'Pipeline',
      desc: 'Full lead inventory with filters',
      stat: data?.totalLeads ?? 0,
      statLabel: 'total leads',
      to: '/leads',
      accent: 'blue',
      primary: true,
    },
    {
      id: 'followups',
      title: "Today's follow-ups",
      desc: 'Due touchpoints for today',
      stat: data?.todayFollowUps ?? 0,
      statLabel: 'due today',
      to: '/follow-ups?type=today',
      accent: 'amber',
    },
    ...(isAdmin
      ? [
          {
            id: 'reports',
            title: 'Intelligence',
            desc: 'Campaigns, conversions, exports',
            stat:
        data?.conversionRate != null
          ? `${Number(data.conversionRate).toFixed(1)}%`
          : '—',
            statLabel: 'conversion',
            to: '/reports',
            accent: 'violet',
          },
        ]
      : []),
  ];

  return (
    <nav className="dock" aria-label="Quick navigation">
      <p className="dock-label">Command dock</p>
      <div className={`dock-grid dock-grid--${actions.length}`}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`dock-card dock-card--${action.accent} ${action.primary ? 'dock-card--primary' : ''}`}
            onClick={() => navigate(action.to)}
          >
            <span className="dock-card-stat">
              {action.stat}
              <small>{action.statLabel}</small>
            </span>
            <span className="dock-card-body">
              <span className="dock-card-title">{action.title}</span>
              <span className="dock-card-desc">{action.desc}</span>
            </span>
            <span className="dock-card-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

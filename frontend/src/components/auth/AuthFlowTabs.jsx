const TABS = [
  { id: 'signin', label: 'Sign in', short: 'Login' },
  { id: 'register', label: 'Create account', short: 'Register' },
];

export default function AuthFlowTabs({ mode, onChange }) {
  return (
    <div className="auth-flow-tabs" role="tablist" aria-label="Account type">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          className={`auth-flow-tab ${mode === tab.id ? 'auth-flow-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.short}</span>
        </button>
      ))}
    </div>
  );
}

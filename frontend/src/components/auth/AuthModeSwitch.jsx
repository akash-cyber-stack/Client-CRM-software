export default function AuthModeSwitch({ mode, onChange }) {
  return (
    <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'signin'}
        className={`auth-mode-tab ${mode === 'signin' ? 'auth-mode-tab-active' : ''}`}
        onClick={() => onChange('signin')}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        className={`auth-mode-tab ${mode === 'register' ? 'auth-mode-tab-active' : ''}`}
        onClick={() => onChange('register')}
      >
        Register
      </button>
      <span
        className="auth-mode-indicator"
        style={{ transform: mode === 'signin' ? 'translateX(0)' : 'translateX(100%)' }}
        aria-hidden
      />
    </div>
  );
}

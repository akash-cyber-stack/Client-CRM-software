export default function AuthLogo({ size = 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  return (
    <div className={`auth-logo-mark ${dim}`} aria-hidden>
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" className="auth-logo-bg" />
        <path
          d="M12 26V14l8 6 8-6v12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="auth-logo-stroke"
        />
        <circle cx="28" cy="12" r="3" className="auth-logo-dot" />
      </svg>
    </div>
  );
}

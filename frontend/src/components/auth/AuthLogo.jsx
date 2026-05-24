/**
 * Brand mark — SL monogram in a refined squircle (auth + reusable).
 */
export default function AuthLogo({ size = 'md', className = '' }) {
  const dim = size === 'sm' ? 'auth-logo--sm' : size === 'lg' ? 'auth-logo--lg' : 'auth-logo--md';

  return (
    <div className={`auth-logo ${dim} ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 48 48" fill="none" className="auth-logo-svg">
        <defs>
          <linearGradient id="auth-logo-ring" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <filter id="auth-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <rect x="1" y="1" width="46" height="46" rx="14" stroke="url(#auth-logo-ring)" strokeWidth="1.5" fill="none" />

        {/* Surface */}
        <rect x="3" y="3" width="42" height="42" rx="12" className="auth-logo-surface" />

        {/* SL monogram */}
        <g className="auth-logo-letters" filter="url(#auth-logo-glow)">
          <path
            d="M16.5 18.2c0-3.2 2.6-5.7 6-5.7s6 2.5 6 5.7c0 2.4-1.6 4.2-4.2 4.8-2.8.6-4.8 2.6-4.8 5.4 0 3.2 2.6 5.7 6 5.7"
            className="auth-logo-glyph"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M31.5 12.5v23M31.5 35.5h7"
            className="auth-logo-glyph"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Accent — lead pulse */}
        <path
          d="M12 38.5h8"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          className="auth-logo-accent"
        />
        <circle cx="22" cy="38.5" r="1.75" fill="#3b82f6" className="auth-logo-accent" />
      </svg>
    </div>
  );
}

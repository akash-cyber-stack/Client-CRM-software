/** Editorial waveform — decorative only */
const BARS = [0.35, 0.55, 0.72, 0.48, 0.88, 0.62, 0.4, 0.78, 0.52, 0.68, 0.44, 0.82];

export default function AuthBrandArt() {
  return (
    <div className="auth-brand-art" aria-hidden>
      <div className="auth-brand-art-glow" />
      <svg viewBox="0 0 320 120" className="auth-brand-art-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="auth-wave-grad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="20%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {BARS.map((h, i) => {
          const barH = h * 88;
          const x = 16 + i * 24;
          const y = 60 - barH / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="10"
              height={barH}
              rx="5"
              fill="url(#auth-wave-grad)"
              className="auth-brand-bar"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          );
        })}
        <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
    </div>
  );
}

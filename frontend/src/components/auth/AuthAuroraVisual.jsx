/** Decorative auth panel — no dashboard, metrics, or mock data */
export default function AuthAuroraVisual() {
  return (
    <div className="auth-aurora" aria-hidden>
      <div className="auth-aurora-blob auth-aurora-blob-1" />
      <div className="auth-aurora-blob auth-aurora-blob-2" />
      <div className="auth-aurora-blob auth-aurora-blob-3" />
      <div className="auth-aurora-grid" />

      <svg className="auth-aurora-network" viewBox="0 0 400 400" fill="none">
        <defs>
          <linearGradient id="auth-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <g className="auth-aurora-lines">
          <path d="M80 200 Q200 80 320 200" stroke="url(#auth-line-grad)" strokeWidth="1.5" />
          <path d="M100 280 Q200 160 300 280" stroke="url(#auth-line-grad)" strokeWidth="1" opacity="0.5" />
          <path d="M120 120 L200 200 L280 120" stroke="url(#auth-line-grad)" strokeWidth="1" opacity="0.4" />
        </g>
        <g className="auth-aurora-nodes">
          {[
            [200, 200, 14],
            [80, 200, 8],
            [320, 200, 8],
            [200, 80, 6],
            [120, 280, 5],
            [300, 280, 5],
            [280, 120, 4],
          ].map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              className="auth-aurora-node"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </g>
      </svg>

      <div className="auth-aurora-ring auth-aurora-ring-outer" />
      <div className="auth-aurora-ring auth-aurora-ring-inner" />

      <div className="auth-aurora-glyphs">
        <span className="auth-aurora-glyph auth-aurora-glyph-1">◇</span>
        <span className="auth-aurora-glyph auth-aurora-glyph-2">◆</span>
        <span className="auth-aurora-glyph auth-aurora-glyph-3">○</span>
      </div>

      <div className="auth-aurora-shine" />
    </div>
  );
}

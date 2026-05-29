import { checkPassword } from '../../utils/passwordPolicy';

const RULES = [
  { key: 'length', label: '6–12 characters' },
  { key: 'upper', label: 'One uppercase letter' },
  { key: 'lower', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'Special symbol (#, @, !, …)' },
];

export default function PasswordStrengthMeter({ password }) {
  const { checks, score, valid } = checkPassword(password);
  const pct = password ? Math.round((score / 5) * 100) : 0;

  return (
    <div className={`pwd-strength ${valid ? 'pwd-strength--valid' : ''}`} aria-live="polite">
      <div className="pwd-strength-track">
        <div
          className="pwd-strength-fill"
          style={{ width: `${pct}%` }}
          data-score={score}
        />
        <div className="pwd-strength-glow" style={{ width: `${pct}%` }} />
      </div>
      <ul className="pwd-strength-rules">
        {RULES.map(({ key, label }) => (
          <li key={key} className={checks[key] ? 'met' : ''}>
            <span className="pwd-strength-dot" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

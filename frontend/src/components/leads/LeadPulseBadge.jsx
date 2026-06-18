import { computeLeadPulse } from '../../utils/leadPulseScore';

export default function LeadPulseBadge({ lead, compact = false }) {
  const pulse = computeLeadPulse(lead);
  if (compact) {
    return (
      <span
        className="lead-pulse-badge lead-pulse-badge--compact"
        style={{ '--pulse-color': pulse.color }}
        title={`Pulse ${pulse.score} — ${pulse.label}`}
      >
        {pulse.score}
      </span>
    );
  }
  return (
    <div className="lead-pulse-badge" style={{ '--pulse-color': pulse.color }}>
      <span className="lead-pulse-badge__score">{pulse.score}</span>
      <span className="lead-pulse-badge__label">{pulse.label}</span>
    </div>
  );
}

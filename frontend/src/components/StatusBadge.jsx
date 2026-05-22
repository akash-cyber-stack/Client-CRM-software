import { STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ') || 'Unknown';
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  return <span className={`badge ${color}`}>{label}</span>;
}

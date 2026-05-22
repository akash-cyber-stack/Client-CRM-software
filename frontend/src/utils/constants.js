export const LEAD_STATUSES = [
  'NEW', 'ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP',
  'CONVERTED', 'NOT_INTERESTED', 'LOST',
];

export const LEAD_SOURCES = ['GOOGLE_ADS', 'META_ADS', 'MANUAL'];

export const ROLES = ['SUPER_ADMIN', 'MANAGER', 'SALES_EMPLOYEE'];

export const STATUS_COLORS = {
  NEW: 'bg-blue-500/20 text-blue-400 dark:text-blue-300',
  ASSIGNED: 'bg-indigo-500/20 text-indigo-400 dark:text-indigo-300',
  CONTACTED: 'bg-cyan-500/20 text-cyan-400 dark:text-cyan-300',
  INTERESTED: 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-300',
  FOLLOW_UP: 'bg-amber-500/20 text-amber-400 dark:text-amber-300',
  CONVERTED: 'bg-green-500/20 text-green-400 dark:text-green-300',
  NOT_INTERESTED: 'bg-slate-500/20 text-muted',
  LOST: 'bg-red-500/20 text-red-400 dark:text-red-300',
};

export const SOURCE_LABELS = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  MANUAL: 'Manual',
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
};

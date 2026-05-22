import { Link } from 'react-router-dom';

export default function StatCard({ title, value, subtitle, icon, color = 'primary', to, hint }) {
  const iconStyles = {
    primary: 'bg-primary-600/15 text-primary-500 dark:text-primary-400',
    green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/15 text-red-600 dark:text-red-400',
    slate: 'bg-slate-500/15 text-muted',
  };

  const inner = (
    <div className="flex items-start justify-between gap-2 h-full min-h-[88px]">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-muted font-medium leading-snug line-clamp-2">{title}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-main tracking-tight">{value ?? 0}</p>
        {subtitle && <p className="text-xs text-subtle mt-1">{subtitle}</p>}
        {to && (
          <p className="text-xs text-primary-500 mt-2 font-medium group-hover:underline">
            {hint || 'Open →'}
          </p>
        )}
      </div>
      {icon && (
        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${iconStyles[color]} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="card group block h-full hover:border-primary-500/50 hover:shadow-glow active:scale-[0.98] transition-all cursor-pointer no-underline relative z-10"
      >
        {inner}
      </Link>
    );
  }

  return <div className="card group h-full">{inner}</div>;
}

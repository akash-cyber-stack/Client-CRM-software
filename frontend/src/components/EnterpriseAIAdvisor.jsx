import { useMemo } from 'react';

function formatLabel(value) {
  return value?.replace(/_/g, ' ') || 'Unknown';
}

export default function EnterpriseAIAdvisor({ data = {}, followUps = [], employees = [] }) {
  const analysis = useMemo(() => {
    const now = new Date();
    const activeEmployees = employees.filter((item) => item.status === 'ACTIVE').length;
    const pendingFollowUps = followUps.filter((item) => !item.isCompleted && new Date(item.scheduledAt) >= now).length;
    const missedFollowUps = followUps.filter((item) => !item.isCompleted && new Date(item.scheduledAt) < now).length;
    const sourceBreakdown = [...(data.sourceBreakdown || [])].sort((a, b) => b.count - a.count);
    const topSource = sourceBreakdown[0];
    const answeredCalls = Number(data.answeredCalls || 0);
    const missedCalls = Number(data.missedCalls || 0);
    const conversionRate = Number(data.conversionRate || 0);

    const recommendations = [];

    if (missedFollowUps > 0) {
      recommendations.push({
        title: 'Overdue follow-ups detected',
        detail: `${missedFollowUps} follow-up${missedFollowUps > 1 ? 's are' : ' is'} overdue. Prioritize the quickest-win leads first to recover conversion.`,
      });
    }

    if (conversionRate < 35) {
      recommendations.push({
        title: 'Conversion is below target',
        detail: `Your conversion rate is ${conversionRate.toFixed(1)}%. Review first-touch messaging, lead routing, and follow-up timing for the hottest leads.`,
      });
    }

    if (missedCalls > answeredCalls) {
      recommendations.push({
        title: 'Call handling needs attention',
        detail: 'Missed calls are higher than answered calls. Route the busiest leads to the strongest reps and review callback workflows.',
      });
    }

    if (topSource?.source) {
      recommendations.push({
        title: 'Best-performing acquisition channel',
        detail: `${formatLabel(topSource.source)} is generating the most leads right now. Increase budget or test similar creatives there first.`,
      });
    }

    if (pendingFollowUps > 0 && missedFollowUps === 0) {
      recommendations.push({
        title: 'Follow-up queue is healthy',
        detail: `${pendingFollowUps} upcoming follow-up${pendingFollowUps > 1 ? 's are' : ' is'} scheduled. Keep the momentum going and auto-review any lead older than 24 hours.`,
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: 'Your CRM is healthy',
        detail: 'No urgent issues are detected right now. Keep monitoring campaign quality and consistency in your follow-up cadence.',
      });
    }

    return {
      activeEmployees,
      missedFollowUps,
      pendingFollowUps,
      recommendations,
      topSource,
      conversionRate,
      answeredCalls,
      missedCalls,
    };
  }, [data, followUps, employees]);

  return (
    <div className="card mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary-500 font-semibold">Enterprise AI Advisor</p>
          <h2 className="text-xl font-bold text-main mt-2">Smart diagnostics for your growth engine</h2>
          <p className="text-sm text-muted mt-1">
            Built for Enterprise customers to turn your CRM signals into clear action steps.
          </p>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold bg-primary-500/10 text-primary-500">
          AI-assisted insight
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <p className="text-xs text-muted">Active employees</p>
          <p className="text-2xl font-bold text-main mt-2">{analysis.activeEmployees}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <p className="text-xs text-muted">Pending follow-ups</p>
          <p className="text-2xl font-bold text-main mt-2">{analysis.pendingFollowUps}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <p className="text-xs text-muted">Missed follow-ups</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{analysis.missedFollowUps}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <p className="text-xs text-muted">Conversion rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{analysis.conversionRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid gap-3">
        {analysis.recommendations.map((item, index) => (
          <div key={item.title} className="rounded-xl border border-default p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-sm font-bold">
                {index + 1}
              </span>
              <h3 className="font-semibold text-main">{item.title}</h3>
            </div>
            <p className="text-sm text-muted leading-6">{item.detail}</p>
          </div>
        ))}
      </div>

      {analysis.topSource?.source && (
        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <p className="text-xs text-muted">Top source signal</p>
          <p className="text-sm font-semibold text-main mt-1">
            {formatLabel(analysis.topSource.source)} is your strongest lead source with {analysis.topSource.count} lead{analysis.topSource.count > 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}

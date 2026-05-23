import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import EmployeePerformanceChart from '../components/EmployeePerformanceChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { SOURCE_LABELS } from '../utils/constants';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const chartTick = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text)',
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.dashboard().then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const sourceData = (data.sourceBreakdown || []).map((s) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s.count,
    source: s.source,
  }));

  const statCards = isAdmin
    ? [
        { title: 'Total Leads', value: data.totalLeads, color: 'primary', to: '/leads' },
        { title: 'New Leads', value: data.newLeads, color: 'slate', to: '/leads?status=NEW' },
        { title: 'Converted', value: data.convertedLeads, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Conversion %', value: `${data.conversionRate}%`, color: 'green', to: '/reports?tab=conversions', hint: 'Open report →' },
        { title: 'Today Follow-ups', value: data.todayFollowUps, color: 'amber', to: '/follow-ups?type=today' },
        { title: 'Total Calls', value: data.totalCalls, color: 'primary', to: '/calls' },
        { title: 'Answered Calls', value: data.answeredCalls, color: 'green', to: '/calls?callStatus=ANSWERED' },
        { title: 'Missed Calls', value: data.missedCalls, color: 'red', to: '/calls?callStatus=MISSED' },
      ]
    : [
        { title: 'My Assigned Leads', value: data.myAssignedLeads ?? data.totalLeads, color: 'primary', to: '/leads' },
        { title: 'New Leads', value: data.newLeads, color: 'slate', to: '/leads?status=NEW' },
        { title: 'Converted', value: data.convertedLeads, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Conversion %', value: `${data.conversionRate}%`, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Today Follow-ups', value: data.todayFollowUps, color: 'amber', to: '/follow-ups?type=today' },
        { title: 'My Pending Leads', value: data.myPendingLeads, color: 'amber', to: '/leads?status=ASSIGNED', hint: 'My pending leads →' },
      ];

  return (
    <div className="page-enter relative z-0">
      <PageHeader
        title="Dashboard"
        subtitle={isAdmin ? 'Overview of leads, calls & performance' : 'Your assigned leads & follow-ups'}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {sourceData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-2 text-main">Leads by Source</h2>
            <p className="text-xs text-muted mb-4">Tap a slice to filter leads by source</p>
            <div className="w-full h-[200px] sm:h-[220px] cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label
                    onClick={(_, index) => {
                      const slice = sourceData[index];
                      if (slice?.source) navigate(`/leads?source=${slice.source}`);
                    }}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <button type="button" className="text-xs text-primary-500 mt-3 hover:underline" onClick={() => navigate('/leads')}>
              View all leads →
            </button>
          </div>
        )}

        {isAdmin && data.employeePerformance?.length > 0 && (
          <EmployeePerformanceChart
            data={data.employeePerformance}
            chartTick={chartTick}
            tooltipStyle={tooltipStyle}
          />
        )}

        {isAdmin && data.campaignBreakdown?.length > 0 && (
          <Link
            to="/reports?tab=campaigns"
            className="card lg:col-span-2 block hover:border-primary-500/40 transition-all active:scale-[0.99] no-underline"
          >
            <h2 className="font-semibold mb-2 text-main">Campaign-wise Leads</h2>
            <p className="text-xs text-primary-500 mb-4">Tap for campaign report →</p>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm min-w-[240px]">
                <thead>
                  <tr className="table-head">
                    <th>Campaign</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaignBreakdown.map((c, i) => (
                    <tr key={i} className="table-row table-row-hover">
                      <td className="text-main">{c.campaign}</td>
                      <td className="font-medium text-main">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link to="/leads" className="btn-primary text-center">View Leads</Link>
        <Link to="/follow-ups?type=today" className="btn-secondary text-center">Today Follow-ups</Link>
      </div>
    </div>
  );
}

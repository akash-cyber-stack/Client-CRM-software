import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import EmployeePerformanceChart from '../components/EmployeePerformanceChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { SOURCE_LABELS, STATUS_LABELS, STATUS_CHART_COLORS } from '../utils/constants';

const SOURCE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];
const CALL_COLORS = ['#22c55e', '#ef4444', '#64748b'];

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`dashboard-chart-card card ${className}`}>
      <div className="dashboard-chart-head">
        <h2 className="dashboard-chart-title">{title}</h2>
        {subtitle && <p className="dashboard-chart-sub">{subtitle}</p>}
      </div>
      <div className="dashboard-chart-body">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const chartTick = isDark ? '#94a3b8' : '#64748b';
  const gridStroke = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.2)';
  const tooltipStyle = {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text)',
    fontSize: '13px',
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportsApi
      .dashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (error) {
    return (
      <div className="page-enter">
        <PageHeader title="Dashboard" subtitle="Overview" />
        <div className="alert-error">{error}</div>
      </div>
    );
  }
  if (!data) return null;

  const sourceData = (data.sourceBreakdown || []).map((s) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s.count,
    source: s.source,
  }));

  const statusData = (data.statusBreakdown || [])
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      status: s.status,
      fill: STATUS_CHART_COLORS[s.status] || '#64748b',
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const trendData = data.leadsLast7Days || [];
  const callData = (data.callBreakdown || []).filter((c) => c.value > 0);

  const statCards = isAdmin
    ? [
        { title: 'Total Leads', value: data.totalLeads, color: 'primary', to: '/leads' },
        { title: 'New Leads', value: data.newLeads, color: 'slate', to: '/leads?status=NEW' },
        { title: 'Converted', value: data.convertedLeads, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Conversion %', value: `${data.conversionRate}%`, color: 'green', to: '/reports?tab=conversions' },
        { title: 'Today Follow-ups', value: data.todayFollowUps, color: 'amber', to: '/follow-ups?type=today' },
        { title: 'Total Calls', value: data.totalCalls, color: 'primary', to: '/calls' },
        { title: 'Answered', value: data.answeredCalls, color: 'green', to: '/calls?callStatus=ANSWERED' },
        { title: 'Missed', value: data.missedCalls, color: 'red', to: '/calls?callStatus=MISSED' },
      ]
    : [
        { title: 'My Leads', value: data.myAssignedLeads ?? data.totalLeads, color: 'primary', to: '/leads' },
        { title: 'New', value: data.newLeads, color: 'slate', to: '/leads?status=NEW' },
        { title: 'Converted', value: data.convertedLeads, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Conversion %', value: `${data.conversionRate}%`, color: 'green', to: '/leads?status=CONVERTED' },
        { title: 'Follow-ups today', value: data.todayFollowUps, color: 'amber', to: '/follow-ups?type=today' },
        { title: 'Pending', value: data.myPendingLeads, color: 'amber', to: '/leads?status=ASSIGNED' },
      ];

  return (
    <div className="page-enter dashboard-page">
      <PageHeader
        title="Dashboard"
        subtitle={isAdmin ? 'Leads, calls & team performance at a glance' : 'Your pipeline & follow-ups'}
      />

      <div className="dashboard-stats grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="dashboard-charts grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {trendData.length > 0 && (
          <ChartCard title="New leads (7 days)" subtitle="Daily intake trend" className="md:col-span-2">
            <div className="dashboard-chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartTick }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTick }} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Leads"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {statusData.length > 0 && (
          <ChartCard title="Leads by status" subtitle="Tap a bar to filter">
            <div className="dashboard-chart-h dashboard-chart-h--scroll">
              <ResponsiveContainer width="100%" height="100%" minWidth={Math.max(280, statusData.length * 56)}>
                <BarChart data={statusData} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: chartTick }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTick }} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="value"
                    name="Leads"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                    onClick={(barData) => {
                      const row = barData?.payload;
                      if (row?.status) navigate(`/leads?status=${row.status}`);
                    }}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {sourceData.length > 0 && (
          <ChartCard title="Leads by source" subtitle="Tap slice to filter">
            <div className="dashboard-chart-h dashboard-chart-h--pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="72%"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    onClick={(_, index) => {
                      const slice = sourceData[index];
                      if (slice?.source) navigate(`/leads?source=${slice.source}`);
                    }}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {isAdmin && callData.length > 0 && (
          <ChartCard title="Call outcomes" subtitle="Answered vs missed">
            <div className="dashboard-chart-h dashboard-chart-h--pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={callData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" label>
                    {callData.map((_, i) => (
                      <Cell key={i} fill={CALL_COLORS[i % CALL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <button
              type="button"
              className="text-xs text-primary-500 mt-3 hover:underline"
              onClick={() => navigate('/calls')}
            >
              View call history →
            </button>
          </ChartCard>
        )}

        {isAdmin && data.employeePerformance?.length > 0 && (
          <div className="md:col-span-2">
            <EmployeePerformanceChart
              data={data.employeePerformance}
              chartTick={chartTick}
              tooltipStyle={tooltipStyle}
            />
          </div>
        )}

        {isAdmin && (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Link
              to="/reports?tab=campaigns"
              className="dashboard-chart-card card block hover:border-primary-500/40 transition-all no-underline"
            >
              <h2 className="dashboard-chart-title">Ad campaign leads</h2>
              <p className="dashboard-chart-sub mb-4">Google Ads & Meta</p>
              {data.campaignBreakdown?.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[200px]">
                    <thead>
                      <tr className="table-head">
                        <th className="text-left py-2">Campaign</th>
                        <th className="text-right py-2">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaignBreakdown.map((c) => (
                        <tr key={c.campaign} className="table-row table-row-hover">
                          <td className="text-main py-2 pr-2 truncate max-w-[140px]">{c.campaign}</td>
                          <td className="font-semibold text-main text-right py-2">{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted py-8 text-center">No campaign leads yet</p>
              )}
            </Link>

            <Link
              to="/leads?source=MANUAL"
              className="dashboard-chart-card card block hover:border-amber-500/30 transition-all no-underline flex flex-col"
            >
              <h2 className="dashboard-chart-title">Manual / import</h2>
              <p className="dashboard-chart-sub mb-4">Not from ads</p>
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <p className="text-4xl sm:text-5xl font-bold text-amber-500 tabular-nums">
                  {data.nonCampaignLeadsCount ?? 0}
                </p>
                <p className="text-sm text-muted mt-2">leads</p>
              </div>
              <p className="text-xs text-primary-500 text-center mt-auto">View manual leads →</p>
            </Link>
          </div>
        )}
      </div>

      <div className="dashboard-actions mt-6 sm:mt-8 flex flex-col xs:flex-row flex-wrap gap-3">
        <Link to="/leads" className="btn-primary text-center flex-1 sm:flex-none min-h-[44px] flex items-center justify-center">
          View all leads
        </Link>
        <Link
          to="/follow-ups?type=today"
          className="btn-secondary text-center flex-1 sm:flex-none min-h-[44px] flex items-center justify-center"
        >
          Today&apos;s follow-ups
        </Link>
        {isAdmin && (
          <Link
            to="/reports"
            className="btn-secondary text-center flex-1 sm:flex-none min-h-[44px] flex items-center justify-center"
          >
            Full reports
          </Link>
        )}
      </div>
    </div>
  );
}

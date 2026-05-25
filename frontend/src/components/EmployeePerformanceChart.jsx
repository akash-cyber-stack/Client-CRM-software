import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function EmployeePerformanceChart({ data, chartTick, tooltipStyle }) {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);

  const onBarClick = (barData) => {
    const row = barData?.payload;
    if (!row?.id) return;
    navigate(`/employees/${row.id}/performance`);
  };

  return (
    <div className="dashboard-chart-card card">
      <div className="dashboard-chart-head">
        <h2 className="dashboard-chart-title">Employee performance</h2>
        <p className="dashboard-chart-sub">Tap blue bar (Leads) for details</p>
      </div>
      <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
        <div
          className="dashboard-chart-h"
          style={{ minWidth: Math.max(280, data.length * 72), height: '240px' }}
        >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ bottom: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTick }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fill: chartTick, fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="leads"
              name="Leads"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={onBarClick}
            >
              {data.map((row) => (
                <Cell
                  key={row.id}
                  fill={activeId === row.id ? '#2563eb' : '#3b82f6'}
                  onMouseEnter={() => setActiveId(row.id)}
                  onMouseLeave={() => setActiveId(null)}
                />
              ))}
            </Bar>
            <Bar dataKey="calls" fill="#8b5cf6" name="Calls" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-primary-500 mt-3">
        Or view all in{' '}
        <button type="button" className="hover:underline font-medium" onClick={() => navigate('/reports?tab=employees')}>
          Reports → Employees
        </button>
      </p>
    </div>
  );
}

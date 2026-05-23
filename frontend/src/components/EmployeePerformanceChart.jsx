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
    <div className="card">
      <h2 className="font-semibold mb-2 text-main">Employee Performance</h2>
      <p className="text-xs text-muted mb-4">Tap a blue bar (Leads) to open that employee&apos;s performance</p>
      <div className="w-full h-[200px] sm:h-[220px]">
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
      <p className="text-xs text-primary-500 mt-3">
        Or view all in{' '}
        <button type="button" className="hover:underline font-medium" onClick={() => navigate('/reports?tab=employees')}>
          Reports → Employees
        </button>
      </p>
    </div>
  );
}

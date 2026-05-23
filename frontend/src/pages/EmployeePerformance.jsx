import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/constants';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function StatBox({ label, value, color = 'text-main' }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-hover)' }}>
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function EmployeePerformance() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(searchParams.get('date') || todayStr());
  const [month, setMonth] = useState(searchParams.get('month') || monthStr());

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.employeePerformance(id, { date, month });
      setData(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load performance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin && user?.id && user.id !== id) return;
    load();
  }, [id, date, month]);

  const applyFilters = () => {
    setSearchParams({ date, month });
    load();
  };

  if (!isAdmin && user?.id !== id) {
    return (
      <div className="card p-8 text-center text-muted">
        You can only view your own performance.
        <Link to={`/employees/${user?.id}/performance`} className="block mt-2 text-primary-500">
          Go to my performance
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { employee, daily, monthly } = data;

  return (
    <div className="page-enter max-w-5xl">
      <Link to="/" className="text-primary-500 text-sm hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main">{employee.name}</h1>
          <p className="text-muted text-sm">
            {employee.role?.replace(/_/g, ' ')} · {employee.email}
            {employee.department ? ` · ${employee.department}` : ''}
          </p>
        </div>
        <Link to={`/leads?assignedToId=${id}`} className="btn-secondary text-sm">
          View all leads
        </Link>
      </div>

      <div className="card mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted mb-1">Day</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Month summary</label>
          <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button type="button" className="btn-primary" onClick={applyFilters}>
          Apply
        </button>
      </div>

      <h2 className="text-lg font-semibold text-main mb-3">
        Daily performance — {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' })}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatBox label="Leads (day)" value={daily.leads.total} />
        <StatBox label="Completed" value={daily.leads.completed} color="text-emerald-500" />
        <StatBox label="Incomplete" value={daily.leads.incomplete} color="text-amber-500" />
        <StatBox label="Calls total" value={daily.calls.total} />
        <StatBox label="Received" value={daily.calls.received} color="text-emerald-500" />
        <StatBox label="Missed" value={daily.calls.missed} color="text-red-500" />
        <StatBox label="Rejected" value={daily.calls.rejected} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="font-medium text-main mb-3">Today&apos;s leads</h3>
          {daily.leadList.length === 0 ? (
            <p className="text-muted text-sm">No lead activity on this day</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {daily.leadList.map((l) => (
                <li key={l.id} className="flex justify-between items-center gap-2 text-sm border-b border-default pb-2">
                  <Link to={`/leads/${l.id}`} className="text-primary-500 hover:underline truncate">
                    {l.customerName}
                  </Link>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 className="font-medium text-main mb-3">Today&apos;s calls</h3>
          {daily.callList.length === 0 ? (
            <p className="text-muted text-sm">No calls on this day</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {daily.callList.map((c) => (
                <li key={c.id} className="text-sm border-b border-default pb-2">
                  <p className="font-medium text-main">{c.lead?.customerName || c.customerPhone}</p>
                  <p className="text-muted text-xs">
                    {c.callType} · {c.callStatus}
                    {c.durationSeconds ? ` · ${c.durationSeconds}s` : ''} · {formatDate(c.callStartTime)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-main mb-3">Month summary — {monthly.monthLabel}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatBox label="Total leads" value={monthly.leads.total} />
        <StatBox label="Converted" value={monthly.leads.completed} color="text-emerald-500" />
        <StatBox label="Incomplete / active" value={monthly.leads.incomplete} color="text-amber-500" />
        <StatBox label="Conversion %" value={`${monthly.conversionRate}%`} color="text-primary-500" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="Total calls" value={monthly.calls.total} />
        <StatBox label="Answered" value={monthly.calls.received} color="text-emerald-500" />
        <StatBox label="Missed" value={monthly.calls.missed} color="text-red-500" />
        <StatBox label="Rejected" value={monthly.calls.rejected} color="text-orange-500" />
      </div>
      <div className="card mb-4">
        <h3 className="font-medium text-main mb-3">Follow-ups this month</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Total" value={monthly.followUps.total} />
          <StatBox label="Completed" value={monthly.followUps.completed} color="text-emerald-500" />
          <StatBox label="Pending" value={monthly.followUps.pending} color="text-amber-500" />
        </div>
      </div>
      {monthly.leadsByStatus?.length > 0 && (
        <div className="card">
          <h3 className="font-medium text-main mb-3">Leads by status (month)</h3>
          <div className="flex flex-wrap gap-2">
            {monthly.leadsByStatus.map((s) => (
              <span key={s.status} className="badge bg-slate-500/20 text-main px-3 py-1">
                {s.status.replace(/_/g, ' ')}: <strong>{s.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

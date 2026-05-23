import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reportsApi, employeesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { SOURCE_LABELS } from '../utils/constants';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'employees');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    source: '',
    employeeId: searchParams.get('employeeId') || '',
  });
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) employeesApi.list().then((res) => setEmployees(res.data.data));
  }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    try {
      let res;
      if (tab === 'employees') res = await reportsApi.employees(params);
      else if (tab === 'calls') res = await reportsApi.calls(params);
      else if (tab === 'campaigns') res = await reportsApi.campaigns(params);
      else res = await reportsApi.conversions(params);
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = searchParams.get('tab');
    const empId = searchParams.get('employeeId');
    if (t && t !== tab) setTab(t);
    if (empId !== null) {
      setFilters((f) => ({ ...f, employeeId: empId || '' }));
    }
  }, [searchParams]);

  useEffect(() => { load(); }, [tab, filters.employeeId]);

  const setReportTab = (t) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  const exportCsv = async () => {
    const res = await reportsApi.exportEmployees();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-report.csv';
    a.click();
  };

  return (
    <div className="page-enter">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-main">Reports</h1>
        {tab === 'employees' && isAdmin && (
          <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
        )}
      </div>

      <div className="card mb-4 flex flex-wrap gap-3">
        <input type="date" className="input max-w-[160px]" value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
        <input type="date" className="input max-w-[160px]" value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        <select className="input max-w-[140px]" value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="">All Sources</option>
          {['GOOGLE_ADS', 'META_ADS', 'MANUAL'].map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        {isAdmin && (
          <select className="input max-w-[180px]" value={filters.employeeId}
            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <button className="btn-primary" onClick={load}>Apply</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['employees', 'calls', 'campaigns', 'conversions'].map((t) => (
          <button key={t} onClick={() => setReportTab(t)}
            className={`capitalize ${tab === t ? 'tab-pill-active' : 'tab-pill'}`}>
            {t}
          </button>
        ))}
      </div>

      {filters.employeeId && tab === 'employees' && (
        <div className="alert-warn mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>Showing performance for selected employee</span>
          <button
            type="button"
            className="text-sm text-primary-500 hover:underline"
            onClick={() => {
              setFilters((f) => ({ ...f, employeeId: '' }));
              setSearchParams({ tab: 'employees' });
            }}
          >
            Show all employees
          </button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          {tab === 'employees' && Array.isArray(data) && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Leads</th>
                    <th className="pb-2">Calls</th>
                    <th className="pb-2">Recordings</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((e) => (
                    <tr
                      key={e.id}
                      className={`border-b table-row-hover ${filters.employeeId === e.id ? 'bg-primary-600/10' : ''}`}
                    >
                      <td className="py-2 font-medium">{e.name}</td>
                      <td className="py-2">{e.assignedLeads?.length ?? 0}</td>
                      <td className="py-2">{e.callLogs?.length ?? 0}</td>
                      <td className="py-2">{e.callLogs?.filter((c) => c.recordingUrl).length ?? 0}</td>
                      <td className="py-2">
                        <Link to={`/leads?assignedToId=${e.id}`} className="text-primary-500 text-sm hover:underline">
                          View leads
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filters.employeeId && data[0] && (
                <div className="mt-6 border-t border-default pt-4">
                  <h3 className="font-semibold text-main mb-3">{data[0].name} — Lead breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <p className="text-xs text-muted">Total leads</p>
                      <p className="text-xl font-bold text-main">{data[0].assignedLeads?.length ?? 0}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <p className="text-xs text-muted">Calls</p>
                      <p className="text-xl font-bold text-main">{data[0].callLogs?.length ?? 0}</p>
                    </div>
                  </div>
                  {data[0].assignedLeads?.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted border-b">
                          <th className="pb-2">Customer</th>
                          <th className="pb-2">Phone</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data[0].assignedLeads.map((l) => (
                          <tr key={l.id} className="border-b border-default">
                            <td className="py-2">
                              <Link to={`/leads/${l.id}`} className="text-primary-500 hover:underline">
                                {l.customerName || 'Lead'}
                              </Link>
                            </td>
                            <td className="py-2">{l.phone || '—'}</td>
                            <td className="py-2">{l.status}</td>
                            <td className="py-2">{SOURCE_LABELS[l.source] || l.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
          {tab === 'calls' && Array.isArray(data) && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2">{c.employee?.name}</td>
                    <td className="py-2">{c.lead?.customerName || c.customerPhone}</td>
                    <td className="py-2">{c.callStatus}</td>
                    <td className="py-2">{c.durationSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'campaigns' && Array.isArray(data) && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b">
                  <th className="pb-2">Campaign</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{c.campaign}</td>
                    <td className="py-2">{SOURCE_LABELS[c.source]}</td>
                    <td className="py-2">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'conversions' && data && (
            <div>
              <p className="mb-4 text-lg">Conversion Rate: <strong>{data.conversionRate}%</strong> ({data.converted}/{data.total})</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b">
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byStatus?.map((s) => (
                    <tr key={s.status} className="border-b">
                      <td className="py-2">{s.status}</td>
                      <td className="py-2">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

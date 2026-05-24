import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leadsApi, employeesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ImportLeadsModal from '../components/ImportLeadsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApiErrorMessage } from '../utils/apiError';
import { LEAD_STATUSES, LEAD_SOURCES, SOURCE_LABELS, formatDate } from '../utils/constants';

const emptyForm = {
  customerName: '', phone: '', email: '', city: '', requirement: '',
  source: 'MANUAL', status: 'NEW', assignedToId: '',
};

export default function Leads() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    assignedToId: '',
  });
  const [manualOpen, setManualOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setListError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await leadsApi.list(params);
      setLeads(res.data.data || []);
      setSelectedIds(new Set());
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load leads');
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedToId = searchParams.get('assignedToId');
    if (status || source || assignedToId) {
      setFilters((f) => ({
        ...f,
        status: status || '',
        source: source || '',
        assignedToId: assignedToId || '',
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [filters.status, filters.source, filters.assignedToId]);

  useEffect(() => {
    if (isAdmin) {
      employeesApi.list().then((res) => setEmployees(res.data.data || [])).catch(() => {});
    }
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        email: form.email?.trim() || undefined,
        assignedToId: form.assignedToId || undefined,
      };
      await leadsApi.create(payload);
      toast.success('Lead created successfully');
      setManualOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to create lead');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const salesEmployees = employees.filter((e) => e.role === 'SALES_EMPLOYEE' && e.status === 'ACTIVE');

  const selectedCount = selectedIds.size;
  const allOnPageSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const someOnPageSelected = leads.some((l) => selectedIds.has(l.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        leads.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        leads.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  const handleDeleteOne = async (lead) => {
    if (!confirm(`Delete lead #${lead.leadNumber} (${lead.customerName})? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await leadsApi.remove(lead.id);
      toast.success('Lead deleted');
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected lead(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await leadsApi.bulkDelete(ids);
      const count = res.data.data?.deletedCount ?? ids.length;
      toast.success(`Deleted ${count} lead(s)`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Bulk delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-main tracking-tight">Leads</h1>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              className="btn-primary flex-1 sm:flex-none"
              onClick={() => { setFormError(''); setForm(emptyForm); setManualOpen(true); }}
            >
              Add Lead Manually
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 sm:flex-none"
              onClick={() => setImportOpen(true)}
            >
              Import Leads
            </button>
          </div>
        )}
      </div>

      {listError && <div className="alert-error mb-4">{listError}</div>}

      <div className="card mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <input
          className="input w-full sm:max-w-xs"
          placeholder="Search name or phone..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="input w-full sm:max-w-[160px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input w-full sm:max-w-[160px]" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="">All Sources</option>
          {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        {isAdmin && (
          <select className="input w-full sm:max-w-[180px]" value={filters.assignedToId} onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}>
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={load}>Filter</button>
      </div>

      {isAdmin && selectedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <span className="text-sm text-main font-medium">
            {selectedCount} selected
          </span>
          <button
            type="button"
            className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
            disabled={deleting}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
          <button
            type="button"
            className="btn-secondary text-sm !border-red-500/40 !text-red-400 hover:!bg-red-500/15 ml-auto"
            disabled={deleting}
            onClick={handleDeleteSelected}
          >
            {deleting ? 'Deleting…' : `Delete selected (${selectedCount})`}
          </button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-muted border-b">
                {isAdmin && (
                  <th className="pb-3 pr-3 w-10">
                    <input
                      type="checkbox"
                      className="auth-checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                      }}
                      onChange={toggleSelectAllOnPage}
                      aria-label="Select all leads on this page"
                      disabled={!leads.length || deleting}
                    />
                  </th>
                )}
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Phone</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Assigned To</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className={`border-b border-default table-row-hover ${selectedIds.has(l.id) ? 'bg-primary-500/5' : ''}`}
                >
                  {isAdmin && (
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        className="auth-checkbox"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        aria-label={`Select lead ${l.customerName}`}
                        disabled={deleting}
                      />
                    </td>
                  )}
                  <td className="py-3 pr-4">#{l.leadNumber}</td>
                  <td className="py-3 pr-4 font-medium">{l.customerName}</td>
                  <td className="py-3 pr-4">{l.phone}</td>
                  <td className="py-3 pr-4">{SOURCE_LABELS[l.source]}</td>
                  <td className="py-3 pr-4"><StatusBadge status={l.status} /></td>
                  <td className="py-3 pr-4">{l.assignedTo?.name || '-'}</td>
                  <td className="py-3 pr-4">{formatDate(l.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/leads/${l.id}`} className="text-primary-600 hover:underline">View</Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                          disabled={deleting}
                          onClick={() => handleDeleteOne(l)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && !listError && <p className="text-center py-8 text-muted">No leads found</p>}
        </div>
      )}

      <Modal open={manualOpen} onClose={() => !saving && setManualOpen(false)} title="Add Lead Manually" size="lg">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="input" placeholder="Customer Name *" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input className="input" placeholder="Phone * (10 digits min)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <textarea className="input" placeholder="Requirement" rows={3} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} />
          <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
          <select className="input" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
            <option value="">Auto-assign (Round Robin)</option>
            {salesEmployees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Lead'}
          </button>
        </form>
      </Modal>

      <ImportLeadsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        employees={employees}
        onSuccess={load}
      />
    </div>
  );
}

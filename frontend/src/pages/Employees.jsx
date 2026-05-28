import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ImportEmployeesModal from '../components/ImportEmployeesModal';
import { getApiErrorMessage } from '../utils/apiError';
import { ROLES, PERFORMANCE_ROLES } from '../utils/constants';
import {
  getPlanLimits,
  planUserLimitLabel,
  planManagerLimitLabel,
  remainingUserSlots,
  remainingManagerSlots,
} from '../utils/planLimits';

const emptyForm = {
  name: '', email: '', phone: '', password: '', role: 'SALES_EMPLOYEE',
  department: 'Sales', ivrAgentId: '', ivrExtension: '', status: 'ACTIVE',
};

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [seats, setSeats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.list();
      setEmployees(res.data.data || []);
      setSeats(res.data.seats || null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load employees'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditId(emp.id);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '', password: '',
      role: emp.role, department: emp.department || '', ivrAgentId: emp.ivrAgentId || '',
      ivrExtension: emp.ivrExtension || '', status: emp.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editId) {
        await employeesApi.update(editId, data);
        toast.success('Employee updated');
      } else {
        await employeesApi.create(data);
        toast.success('Employee created');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Save failed');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await employeesApi.remove(id);
      toast.success('Employee deleted');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const planLimits = getPlanLimits(user?.plan);
  const seatsUsed = seats?.used ?? employees.length;
  const seatsMax = seats?.max ?? planLimits.maxUsers;
  const slotsLeft = seats?.remaining ?? remainingUserSlots(user?.plan, seatsUsed);
  const managersUsed = employees.filter((e) => e.role === 'MANAGER').length;
  const managersMax = planLimits.maxManagers;
  const managersRemaining = remainingManagerSlots(user?.plan, managersUsed);
  const atLimit = seatsMax != null && seatsUsed >= seatsMax;
  const limitMessage = planUserLimitLabel(user?.plan);
  const managerLimitMessage = planManagerLimitLabel(user?.plan);

  return (
    <div className="page-enter">
      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setImportOpen(true)}>Import Employees</button>
          <button
            className="btn-primary"
            onClick={openCreate}
            disabled={atLimit}
            title={atLimit ? limitMessage || 'User limit reached' : ''}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {seatsMax != null && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            seatsUsed > seatsMax
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : atLimit
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-default bg-[var(--surface-hover)] text-muted'
          }`}
        >
          <span className="font-semibold text-main tabular-nums">{seatsUsed}</span>
          <span> / {seatsMax} users</span>
          <span className="text-muted"> (Super Admin included)</span>
          {seatsUsed > seatsMax && (
            <p className="mt-1 text-red-300/90">
              Over plan limit by {seatsUsed - seatsMax}. Remove extra users — new imports are blocked until you are at or below {seatsMax}.
            </p>
          )}
          {!atLimit && slotsLeft > 0 && seatsUsed <= seatsMax && (
            <span className="block mt-1 text-muted">You can add {slotsLeft} more from Excel or manual add.</span>
          )}
          {atLimit && seatsUsed <= seatsMax && limitMessage && (
            <p className="mt-1 text-amber-300/90">{limitMessage}</p>
          )}
          {(atLimit || seatsUsed > seatsMax) && (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
              onClick={() => navigate('/settings?focus=subscription')}
            >
              Upgrade plan now
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}

      {managersMax != null && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${managersUsed > managersMax ? 'border-red-500/40 bg-red-500/10 text-red-200' : managersRemaining <= 0 ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-default bg-[var(--surface-hover)] text-muted'}`}>
          <span className="font-semibold text-main tabular-nums">{managersUsed}</span>
          <span> / {managersMax} managers</span>
          {managersUsed > managersMax && (
            <p className="mt-1 text-red-300/90">Over manager limit by {managersUsed - managersMax}. Remove managers or upgrade plan.</p>
          )}
          {managersRemaining > 0 && managersUsed <= managersMax && (
            <span className="block mt-1 text-muted">You can add {managersRemaining} more manager(s).</span>
          )}
          {managersRemaining <= 0 && managerLimitMessage && (
            <p className="mt-1 text-amber-300/90">{managerLimitMessage}</p>
          )}
          {managersRemaining <= 0 && (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
              onClick={() => navigate('/settings?focus=subscription')}
            >
              Upgrade for more managers
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">IVR Agent ID</th>
                <th className="pb-3 pr-4">Extension</th>
                <th className="pb-3 pr-4">Leads</th>
                <th className="pb-3 pr-4">Calls</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-default">
                  <td className="py-3 pr-4 font-medium">{e.name}</td>
                  <td className="py-3 pr-4">{e.email}</td>
                  <td className="py-3 pr-4">{e.role.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{e.ivrAgentId || '-'}</td>
                  <td className="py-3 pr-4">{e.ivrExtension || '-'}</td>
                  <td className="py-3 pr-4">{e._count?.assignedLeads ?? 0}</td>
                  <td className="py-3 pr-4">{e._count?.callLogs ?? 0}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${e.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    {PERFORMANCE_ROLES.includes(e.role) && (
                      <Link to={`/employees/${e.id}/performance`} className="text-primary-600 text-sm hover:underline">
                        Performance
                      </Link>
                    )}
                    <button className="text-primary-600 text-sm" onClick={() => openEdit(e)}>Edit</button>
                    {e.role !== 'SUPER_ADMIN' && (
                      <button className="text-red-600 text-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editId ? 'Edit Employee' : 'Add Employee'} size="lg">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input className="input col-span-2" placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email *" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder={editId ? 'New password (optional)' : 'Password *'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <input className="input" placeholder="IVR Agent ID" value={form.ivrAgentId} onChange={(e) => setForm({ ...form, ivrAgentId: e.target.value })} />
          <input className="input" placeholder="IVR Extension" value={form.ivrExtension} onChange={(e) => setForm({ ...form, ivrExtension: e.target.value })} />
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="submit" className="btn-primary col-span-2" disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <ImportEmployeesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={load}
        plan={user?.plan}
        seatsUsed={seatsUsed}
        seatsMax={seatsMax}
        slotsLeft={slotsLeft}
      />
    </div>
  );
}

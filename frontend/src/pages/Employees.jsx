import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeesApi } from '../api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApiErrorMessage } from '../utils/apiError';
import { ROLES } from '../utils/constants';

const emptyForm = {
  name: '', email: '', phone: '', password: '', role: 'SALES_EMPLOYEE',
  department: 'Sales', ivrAgentId: '', ivrExtension: '', status: 'ACTIVE',
};

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.list();
      setEmployees(res.data.data || []);
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

  return (
    <div className="page-enter">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button className="btn-primary" onClick={openCreate}>+ Add Employee</button>
      </div>

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
                    <Link to={`/employees/${e.id}/performance`} className="text-primary-600 text-sm hover:underline">
                      Performance
                    </Link>
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
    </div>
  );
}

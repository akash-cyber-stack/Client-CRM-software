import { useEffect, useState } from 'react';
import { companiesApi, authApi } from '../api';
import { useToast } from '../context/ToastContext';
import GstOtpPanel from '../components/auth/GstOtpPanel';

export default function Companies() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', gstin: '', phone: '', email: '' });
  const [verifying, setVerifying] = useState(false);
  const [gstPreview, setGstPreview] = useState(null);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerificationToken, setGstVerificationToken] = useState(null);

  const load = () => {
    setLoading(true);
    companiesApi
      .list()
      .then((res) => setList(res.data.data || []))
      .catch(() => toast.error('Could not load companies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const verifyGst = async () => {
    setVerifying(true);
    setGstPreview(null);
    setGstVerified(false);
    setGstVerificationToken(null);
    try {
      const res = await authApi.verifyGst(form.gstin);
      const data = res.data.data;
      setGstPreview(data);
      setGstVerified(Boolean(data.gstin && !data.alreadyRegistered));
      toast.success(res.data.message || 'GST verified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'GST verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!gstVerificationToken) {
      toast.error('Complete OTP verification first');
      return;
    }
    try {
      await companiesApi.create({
        name: form.name,
        gstin: form.gstin,
        gstVerificationToken,
        contactPhone: form.phone,
        contactEmail: form.email,
      });
      toast.success('Company registered');
      setForm({ name: '', gstin: '', phone: '', email: '' });
      setGstPreview(null);
      setGstVerified(false);
      setGstVerificationToken(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register company');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-main">Companies</h1>
        <p className="text-muted text-sm mt-1">
          Client ka GST verify karein — OTP unke mobile aur email par jayega.
        </p>
      </div>

      <div className="card p-5 max-w-xl">
        <h2 className="text-lg font-semibold text-main mb-4">Add company</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Company name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Acme Pvt Ltd"
            />
          </div>
          <div>
            <label className="label">GSTIN (15 characters)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1 uppercase"
                value={form.gstin}
                onChange={(e) => {
                  setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }));
                  setGstPreview(null);
                  setGstVerified(false);
                  setGstVerificationToken(null);
                }}
                required
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
              />
              <button type="button" className="btn-secondary shrink-0" onClick={verifyGst} disabled={verifying}>
                {verifying ? '…' : 'Verify GST'}
              </button>
            </div>
            {gstPreview?.legalName && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">✓ {gstPreview.legalName}</p>
            )}
          </div>

          <div>
            <label className="label">Client mobile</label>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => {
                setForm((f) => ({ ...f, phone: e.target.value }));
                setGstVerificationToken(null);
              }}
              placeholder="10-digit mobile"
            />
          </div>
          <div>
            <label className="label">Client email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setGstVerificationToken(null);
              }}
              placeholder="client@company.com"
            />
          </div>

          {gstVerified && !gstVerificationToken && (
            <GstOtpPanel
              gstin={form.gstin}
              phone={form.phone}
              email={form.email}
              gstVerified={gstVerified}
              autoSend
              onVerified={(data) => {
                setGstVerificationToken(data.gstVerificationToken);
                toast.success('OTP verified');
              }}
              onError={(msg) => toast.error(msg)}
            />
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!form.name || !form.gstin || !gstVerificationToken}
          >
            Register company
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-default">
          <h2 className="font-semibold text-main">All companies ({list.length})</h2>
        </div>
        {loading ? (
          <p className="p-6 text-muted text-sm">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-6 text-muted text-sm">No companies yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-default">
                  <th className="p-3">Name</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Users</th>
                  <th className="p-3">Leads</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-default/60">
                    <td className="p-3 font-medium text-main">{c.name}</td>
                    <td className="p-3 font-mono text-xs">{c.gstin}</td>
                    <td className="p-3">{c._count?.users ?? '—'}</td>
                    <td className="p-3">{c._count?.leads ?? '—'}</td>
                    <td className="p-3">
                      <span className={c.gstVerified ? 'text-emerald-500' : 'text-amber-500'}>
                        {c.gstVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

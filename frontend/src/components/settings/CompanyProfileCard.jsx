import { useEffect, useState } from 'react';
import { companiesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfileCard() {
  const { isSuperAdmin } = useAuth();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', contactPhone: '', contactEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    companiesApi
      .getMe()
      .then((res) => {
        const c = res.data.data;
        setCompany(c);
        setForm({
          name: c.name || '',
          contactPhone: c.contactPhone || '',
          contactEmail: c.contactEmail || '',
        });
      })
      .catch(() => setMessage('Could not load company profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await companiesApi.updateMe(form);
      setCompany(res.data.data);
      setMessage('Company profile saved');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-card profile-card--loading">
        <p className="text-muted text-sm">Loading company profile…</p>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <div>
          <h2 className="profile-card-title">Company & GST</h2>
          <p className="profile-card-sub">Legal identity, GST verification, and business contacts</p>
        </div>
        {company.gstVerified && (
          <span className="profile-verified-badge">GST verified</span>
        )}
      </div>

      <div className="profile-readonly-grid">
        <div className="profile-field-block">
          <span className="profile-label">GSTIN</span>
          <span className="profile-value profile-value-mono">{company.gstin}</span>
        </div>
        <div className="profile-field-block">
          <span className="profile-label">Legal name (registry)</span>
          <span className="profile-value">{company.gstLegalName || '—'}</span>
        </div>
        <div className="profile-field-block profile-field-block--wide">
          <span className="profile-label">Registered address</span>
          <span className="profile-value">{company.gstAddress || '—'}</span>
        </div>
        <div className="profile-field-block">
          <span className="profile-label">GST mobile (registry)</span>
          <span className="profile-value">{company.maskedRegMobile || '—'}</span>
        </div>
        <div className="profile-field-block">
          <span className="profile-label">GST email (registry)</span>
          <span className="profile-value">{company.maskedRegEmail || '—'}</span>
        </div>
      </div>

      {message && (
        <div className={message.includes('saved') ? 'alert-success mb-4' : 'alert-error mb-4'}>{message}</div>
      )}

      <form onSubmit={onSave} className="profile-form">
        <div className="profile-form-grid">
          <div>
            <label className="label">Display company name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <label className="label">Business phone</label>
            <input
              className="input"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+91 …"
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <label className="label">Business email</label>
            <input
              type="email"
              className="input"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="billing@company.com"
              disabled={!isSuperAdmin}
            />
          </div>
        </div>
        {!isSuperAdmin && (
          <p className="text-xs text-muted mt-2">Only Super Admin can edit company details.</p>
        )}
        {isSuperAdmin && (
          <button type="submit" className="btn-primary mt-4" disabled={saving}>
            {saving ? 'Saving…' : 'Save company profile'}
          </button>
        )}
      </form>
    </div>
  );
}

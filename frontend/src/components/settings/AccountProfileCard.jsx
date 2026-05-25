import { useState } from 'react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AccountProfileCard() {
  const { user, setSessionFromToken } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const onSave = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await authApi.updateProfile(payload);
      const token = localStorage.getItem('token');
      if (token) await setSessionFromToken(token);
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMessage(res.data.message || 'Profile updated');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <div>
          <h2 className="profile-card-title">Your account</h2>
          <p className="profile-card-sub">Login email, name, phone, and password</p>
        </div>
      </div>

      <div className="profile-readonly-grid mb-4">
        <div className="profile-field-block">
          <span className="profile-label">Work email</span>
          <span className="profile-value">{user?.email}</span>
        </div>
        <div className="profile-field-block">
          <span className="profile-label">Role</span>
          <span className="profile-value">{user?.role?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {message && (
        <div className={message.toLowerCase().includes('updated') ? 'alert-success mb-4' : 'alert-error mb-4'}>
          {message}
        </div>
      )}

      <form onSubmit={onSave} className="profile-form">
        <div className="profile-form-grid">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 …"
            />
          </div>
        </div>

        <div className="profile-password-section mt-6">
          <h3 className="text-sm font-semibold text-main mb-3">Change password</h3>
          <div className="profile-form-grid">
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                className="input"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-xs text-muted mt-2">Leave blank to keep current password.</p>
        </div>

        <button type="submit" className="btn-primary mt-4" disabled={saving}>
          {saving ? 'Saving…' : 'Save account'}
        </button>
      </form>
    </div>
  );
}

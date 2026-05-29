import { useState } from 'react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthMeter from '../auth/PasswordStrengthMeter';
import { checkPassword } from '../../utils/passwordPolicy';
import { normalizePhoneInput } from '../../utils/phoneVerifySession';

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

  const changingPassword = Boolean(form.newPassword);
  const passwordPolicy = checkPassword(form.newPassword);
  const passwordsMatch = !changingPassword || form.newPassword === form.confirmPassword;
  const canSavePassword =
    !changingPassword ||
    (passwordPolicy.valid && passwordsMatch && form.currentPassword.trim());

  const onSave = async (e) => {
    e.preventDefault();
    if (changingPassword && !form.currentPassword.trim()) {
      setMessage('Enter your current password to set a new one');
      return;
    }
    if (changingPassword && !passwordPolicy.valid) {
      setMessage('New password must meet all requirements below');
      return;
    }
    if (changingPassword && !passwordsMatch) {
      setMessage('New passwords do not match');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name,
        phone: normalizePhoneInput(form.phone),
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
      const data = err.response?.data;
      setMessage(data?.errors?.[0] || data?.message || 'Update failed');
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
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="10-digit mobile (contact only)"
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
                maxLength={12}
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
                maxLength={12}
                autoComplete="new-password"
              />
            </div>
          </div>
          {changingPassword && (
            <div className="profile-password-meter mt-3">
              <PasswordStrengthMeter password={form.newPassword} />
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted mt-2">
            Leave blank to keep current password. New password: 6–12 characters with uppercase, number, and symbol (#, @, …).
          </p>
        </div>

        <button type="submit" className="btn-primary mt-4" disabled={saving || !canSavePassword}>
          {saving ? 'Saving…' : 'Save account'}
        </button>
      </form>
    </div>
  );
}

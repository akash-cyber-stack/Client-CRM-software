import { useEffect, useState } from 'react';
import { employeesApi, notificationsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { planHasEmailAlerts } from '../../utils/planAccess';

const TAB_LABELS = {
  employees: 'Employee performance',
  calls: 'Call analytics',
  campaigns: 'Campaign report',
  conversions: 'Conversion report',
};

export default function TeamNoticeCard() {
  const { user } = useAuth();
  const plan = user?.company?.plan || user?.plan;
  const emailAlerts = planHasEmailAlerts(plan);

  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    employeesApi
      .list()
      .then((res) => {
        const list = (res.data.data || []).filter((e) => e.role !== 'SUPER_ADMIN');
        setEmployees(list);
      })
      .catch(() => {});
  }, []);

  const onSend = async (e) => {
    e.preventDefault();
    if (!emailAlerts) {
      setFeedback('Upgrade to Professional or Enterprise to email your team.');
      return;
    }
    setSending(true);
    setFeedback('');
    try {
      const userIds = target === 'selected' ? selectedIds : undefined;
      const res = await notificationsApi.broadcast({
        title,
        message,
        userIds,
      });
      setFeedback(res.data.message || 'Notice sent');
      setTitle('');
      setMessage('');
      setSelectedIds([]);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Could not send notice');
    } finally {
      setSending(false);
    }
  };

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (!emailAlerts) {
    return (
      <div className="profile-card mt-6">
        <h2 className="profile-card-title">Team email notices</h2>
        <p className="profile-card-sub text-muted">
          Send leads, reports, and announcements to your team&apos;s registered email — available on{' '}
          <strong>Professional</strong> and <strong>Enterprise</strong> plans.
        </p>
      </div>
    );
  }

  return (
    <div className="profile-card mt-6">
      <h2 className="profile-card-title">Team email notices</h2>
      <p className="profile-card-sub">
        Send a notice to everyone or selected members. They receive an in-app alert and a professional
        email (even if CRM is closed) signed with your name as Super Admin.
      </p>

      {feedback && (
        <div
          className={
            feedback.toLowerCase().includes('sent')
              ? 'alert-success mb-4'
              : 'alert-error mb-4'
          }
        >
          {feedback}
        </div>
      )}

      <form onSubmit={onSend} className="profile-form max-w-xl">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New lead assignment policy"
            required
          />
        </div>
        <div className="mt-3">
          <label className="label">Message</label>
          <textarea
            className="input min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your notice…"
            required
          />
        </div>
        <div className="mt-3">
          <label className="label">Recipients</label>
          <select
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="all">All team members</option>
            <option value="selected">Selected members only</option>
          </select>
        </div>
        {target === 'selected' && (
          <div className="mt-3 max-h-40 overflow-y-auto border border-default rounded-lg p-3 space-y-2">
            {employees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp.id)}
                  onChange={() => toggleId(emp.id)}
                />
                <span>
                  {emp.name} <span className="text-muted">({emp.email})</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <button type="submit" className="btn-primary mt-4" disabled={sending}>
          {sending ? 'Sending…' : 'Send notice + email'}
        </button>
      </form>
    </div>
  );
}

export function ReportEmailButton({ tab, summary }) {
  const { user, isAdmin } = useAuth();
  const plan = user?.company?.plan || user?.plan;
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  if (!isAdmin || !planHasEmailAlerts(plan)) return null;

  const onShare = async () => {
    setSending(true);
    setMsg('');
    try {
      const res = await notificationsApi.shareReport({
        reportLabel: TAB_LABELS[tab] || tab,
        summary: summary || '',
      });
      setMsg(res.data.message || 'Team emailed');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to email team');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className="btn-secondary text-sm" disabled={sending} onClick={onShare}>
        {sending ? 'Emailing team…' : 'Email team this report'}
      </button>
      {msg && <span className="text-xs text-muted max-w-[220px] text-right">{msg}</span>}
    </div>
  );
}

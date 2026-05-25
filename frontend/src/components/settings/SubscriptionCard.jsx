import { useEffect, useState } from 'react';
import { billingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionCard() {
  const { user, isSuperAdmin, setSessionFromToken } = useAuth();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [subRes, plansRes] = await Promise.all([
          billingApi.subscription(),
          billingApi.plans(),
        ]);
        if (!cancelled) {
          setSub(subRes.data.data);
          setPlans(plansRes.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load subscription');
          if (user?.company) {
            setSub({
              plan: user.company.plan,
              subscriptionStatus: user.company.subscriptionStatus,
              planDetails: null,
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activate = async () => {
    setActivating(true);
    setMessage('');
    try {
      await billingApi.activate({ paymentId: `mock_${Date.now()}` });
      const token = localStorage.getItem('token');
      if (token) await setSessionFromToken(token);
      const subRes = await billingApi.subscription();
      setSub(subRes.data.data);
      setMessage('Subscription activated');
      setError('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Activation failed');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-card">
        <p className="text-muted text-sm">Loading subscription…</p>
      </div>
    );
  }

  const active = sub?.subscriptionStatus === 'ACTIVE';
  const planInfo = sub?.planDetails || plans.find((p) => p.id === sub?.plan || user?.plan);

  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <div>
          <h2 className="profile-card-title">Subscription & billing</h2>
          <p className="profile-card-sub">Plan payment required to use CRM</p>
        </div>
        <span className={`profile-verified-badge ${active ? '' : 'profile-verified-badge--warn'}`}>
          {active ? 'Active' : 'Payment pending'}
        </span>
      </div>

      {error && <div className="alert-error mb-4 text-sm">{error}</div>}

      <div className="profile-readonly-grid mb-4">
        <div className="profile-field-block profile-field-block--wide">
          <span className="profile-label">Company ID (webhooks)</span>
          <span className="profile-value profile-value-mono text-xs break-all">{user?.companyId}</span>
        </div>
        <div className="profile-field-block">
          <span className="profile-label">Plan</span>
          <span className="profile-value">
            {planInfo?.name || sub?.plan || '—'}
            {planInfo?.priceLabel ? ` — ${planInfo.priceLabel}${planInfo.period || ''}` : ''}
          </span>
        </div>
      </div>

      {message && (
        <div className={message.includes('activated') ? 'alert-success mb-4' : 'alert-error mb-4'}>{message}</div>
      )}

      {!active && isSuperAdmin && (
        <button type="button" className="btn-primary w-full sm:w-auto" disabled={activating} onClick={activate}>
          {activating ? 'Activating…' : `Pay ${planInfo?.priceLabel || ''} & activate (demo)`}
        </button>
      )}
    </div>
  );
}

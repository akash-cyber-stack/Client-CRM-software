import { useState } from 'react';
import { billingApi } from '../../api';

export default function PaymentStep({ paymentToken, planDetails, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    onError?.('');
    try {
      const res = await billingApi.confirmPayment({
        paymentToken,
        plan: planDetails?.id,
        paymentId: `mock_${Date.now()}`,
      });
      const data = res.data.data;
      if (data.token) {
        onSuccess?.(data.token, data.user);
      } else {
        onSuccess?.(null, null);
      }
    } catch (err) {
      onError?.(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-step">
      <div className="payment-step-head">
        <span className="payment-step-badge">Almost there</span>
        <h2 className="payment-step-title">Complete your payment</h2>
        <p className="payment-step-sub">
          {planDetails?.name} plan — <strong>{planDetails?.priceLabel}{planDetails?.period}</strong>
        </p>
      </div>
      <p className="text-sm text-muted mb-4">
        Payment ke baad hi CRM use kar paoge. (Demo mode: Pay button se instant activate hota hai.)
      </p>
      <button type="button" className="auth-submit" disabled={loading} onClick={pay}>
        {loading ? 'Processing…' : `Pay ${planDetails?.priceLabel || ''} & Start CRM`}
      </button>
    </div>
  );
}

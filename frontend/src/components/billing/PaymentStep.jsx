import { useState } from 'react';
import { billingApi } from '../../api';
import { openRazorpayCheckout } from '../../utils/razorpayCheckout';

export default function PaymentStep({ paymentToken, planDetails, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    onError?.('');
    try {
      let res;
      if (paymentToken) {
        res = await billingApi.checkoutPublic({ paymentToken, plan: planDetails?.id });
      } else {
        res = await billingApi.checkout({ plan: planDetails?.id });
      }

      const session = res.data.data;
      if (session?.provider !== 'razorpay') {
        throw new Error('Real payment gateway is not configured');
      }

      const payment = await openRazorpayCheckout(session);

      const confirmRes = await billingApi.confirmPayment({
        paymentToken,
        plan: planDetails?.id,
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      const confirmData = confirmRes.data.data;
      if (confirmData.token) {
        onSuccess?.(confirmData.token, confirmData.user);
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
        Account activates only after successful real payment (UPI, card, netbanking, wallet).
      </p>
      <button type="button" className="auth-submit" disabled={loading} onClick={pay}>
        {loading ? 'Processing…' : `Pay ${planDetails?.priceLabel || ''} & Start CRM`}
      </button>
    </div>
  );
}

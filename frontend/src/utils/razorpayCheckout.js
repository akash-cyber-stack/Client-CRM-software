const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export async function openRazorpayCheckout(session, { onDismiss } = {}) {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency || 'INR',
      name: session.name || 'Sales Lead CRM',
      description: session.description || `${session.planName || 'CRM'} payment`,
      order_id: session.orderId,
      prefill: session.prefill || {},
      notes: session.notes || {},
      theme: { color: '#c9a227' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error('Payment was cancelled'));
        },
      },
    });
    rzp.open();
  });
}

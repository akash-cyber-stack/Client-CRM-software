import { useState, useRef, useEffect } from 'react';

const DIGITS = 6;

const CHANNEL_META = {
  email: {
    icon: '✉',
    title: 'Check your email',
    subtitle: (dest) => (
      <>
        We sent a 6-digit code to <strong>{dest}</strong>
      </>
    ),
  },
  phone: {
    icon: '📱',
    title: 'Check your phone',
    subtitle: (dest) => (
      <>
        We sent a 6-digit SMS to <strong>{dest}</strong>
      </>
    ),
  },
};

export default function OtpVerification({
  channel = 'email',
  destination,
  maskedDestination,
  onVerified,
  onResend,
  loading,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const meta = CHANNEL_META[channel] || CHANNEL_META.email;
  const dest = maskedDestination || destination;

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    const nextIndex = Math.min(index + 1, DIGITS - 1);
    if (nextIndex < DIGITS && inputs.current[nextIndex]) {
      inputs.current[nextIndex].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (text.length === DIGITS) {
      setDigits(text.split(''));
      inputs.current[DIGITS - 1]?.focus();
    }
  };

  const code = digits.join('');
  const complete = code.length === DIGITS && digits.every((d) => d !== '');

  return (
    <div className="email-verify">
      <div className="email-verify-orb email-verify-orb--a" />
      <div className="email-verify-orb email-verify-orb--b" />
      <div className="email-verify-core">
        <div className="email-verify-icon-wrap">
          <span className="email-verify-icon">{meta.icon}</span>
        </div>
        <h2 className="email-verify-title">{meta.title}</h2>
        <p className="email-verify-sub">{meta.subtitle(dest)}</p>

        <div className="email-verify-otp-row">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`email-verify-digit ${d ? 'filled' : ''} ${complete ? 'complete' : ''}`}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="auth-submit email-verify-submit"
          disabled={!complete || loading}
          onClick={() => onVerified(code)}
        >
          {loading ? 'Verifying…' : 'Verify & continue'}
        </button>

        <button type="button" className="email-verify-resend" disabled={loading} onClick={onResend}>
          Resend code
        </button>
      </div>
    </div>
  );
}

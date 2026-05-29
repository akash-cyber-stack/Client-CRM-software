import { useState, useRef, useEffect } from 'react';

const DIGITS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InlineEmailOtp({
  email,
  verified,
  maskedEmail,
  loading,
  otpSent,
  onRequestOtp,
  onVerify,
  onResend,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [expanded, setExpanded] = useState(false);
  const inputs = useRef([]);

  const validEmail = EMAIL_RE.test(String(email || '').trim());

  useEffect(() => {
    if (!otpSent) {
      setExpanded(false);
      setDigits(['', '', '', '', '', '']);
    } else {
      setExpanded(true);
      setTimeout(() => inputs.current[0]?.focus(), 120);
    }
  }, [otpSent]);

  useEffect(() => {
    if (!verified) return;
    setExpanded(false);
    setDigits(['', '', '', '', '', '']);
  }, [verified]);

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

  const handleRequest = async () => {
    const ok = await onRequestOtp();
    if (ok !== false) setExpanded(true);
  };

  if (!validEmail) return null;

  if (verified) {
    return (
      <div className="auth-email-otp-inline auth-email-otp-inline--verified" role="status">
        <span className="auth-email-otp-badge">✓</span>
        <span>Email verified</span>
      </div>
    );
  }

  return (
    <div className="auth-email-otp-inline">
      {!expanded && (
        <button
          type="button"
          className="auth-verify-otp-btn"
          disabled={loading}
          onClick={handleRequest}
        >
          <span className="auth-verify-otp-btn-shine" aria-hidden="true" />
          <span className="auth-verify-otp-btn-text">
            {loading ? 'Sending code…' : 'Verify OTP'}
          </span>
        </button>
      )}

      {expanded && (
        <div className="auth-email-otp-panel">
          <div className="auth-email-otp-panel-glow" aria-hidden="true" />
          <p className="auth-email-otp-panel-hint">
            Enter the 6-digit code sent to <strong>{maskedEmail || email}</strong>
          </p>
          <div className="email-verify-otp-row auth-email-otp-digits">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`email-verify-digit ${d ? 'filled' : ''}`}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <div className="auth-email-otp-actions">
            <button
              type="button"
              className="auth-submit auth-email-otp-submit"
              disabled={!complete || loading}
              onClick={() => onVerify(code)}
            >
              {loading ? 'Verifying…' : 'Confirm OTP'}
            </button>
            <button
              type="button"
              className="email-verify-resend"
              disabled={loading}
              onClick={onResend}
            >
              Resend code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

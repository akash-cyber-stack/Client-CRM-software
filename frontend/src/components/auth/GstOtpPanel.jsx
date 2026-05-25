import { useCallback, useEffect, useRef, useState } from 'react';
import { authApi } from '../../api';
import { maskEmail, maskPhone } from '../../utils/contactMask';

function digits10(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  return null;
}

export default function GstOtpPanel({
  gstin,
  phone,
  email,
  gstVerified,
  autoSend = true,
  onVerified,
  onError,
}) {
  const [challengeId, setChallengeId] = useState(null);
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const [message, setMessage] = useState('');
  const lastAutoKey = useRef('');

  const phoneOk = Boolean(digits10(phone));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  const ready = gstVerified && phoneOk && emailOk;

  const sendOtp = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setMessage('');
    onError?.('');
    try {
      const res = await authApi.gstSendOtp({
        gstin,
        channel: 'both',
        mobile: phone,
        email: email.trim(),
      });
      const data = res.data.data;
      setChallengeId(data.challengeId);
      setSent(true);
      setDevOtp(data.devOtp || null);
      setMessage(res.data.message || 'OTP sent to your mobile and email');
    } catch (err) {
      setSent(false);
      const msg = err.response?.data?.message || 'Could not send OTP';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [ready, gstin, phone, email, onError]);

  useEffect(() => {
    setSent(false);
    setChallengeId(null);
    setOtp('');
    setDevOtp(null);
    setMessage('');
    lastAutoKey.current = '';
  }, [gstin, phone, email]);

  useEffect(() => {
    if (!autoSend || !ready || sent || loading) return undefined;
    const key = `${gstin}|${digits10(phone)}|${email.trim().toLowerCase()}`;
    if (lastAutoKey.current === key) return undefined;
    const timer = setTimeout(() => {
      lastAutoKey.current = key;
      void sendOtp();
    }, 700);
    return () => clearTimeout(timer);
  }, [autoSend, ready, sent, loading, gstin, phone, email, sendOtp]);

  const verifyOtp = async () => {
    setLoading(true);
    setMessage('');
    onError?.('');
    try {
      const res = await authApi.gstVerifyOtp({ gstin, otp, challengeId });
      onVerified?.(res.data.data);
      setMessage('Verified — continue registration');
    } catch (err) {
      onError?.(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const maskedMobile = phoneOk ? maskPhone(digits10(phone)) : null;
  const maskedEmail = emailOk ? maskEmail(email.trim()) : null;

  if (!gstVerified) return null;

  return (
    <div className="gst-otp-panel">
      <div className="gst-otp-header">
        <span className="gst-otp-badge">Account verification</span>
        <p className="gst-otp-title">OTP aapke phone & email par</p>
        <p className="gst-otp-sub">
          {ready
            ? 'Valid mobile + email daalte hi OTP dono par bhej diya jayega.'
            : 'Pehle 10-digit mobile aur valid email bhariye.'}
        </p>
      </div>

      {(maskedMobile || maskedEmail) && (
        <div className="gst-otp-contacts">
          {maskedMobile && (
            <div className="gst-otp-contact-row">
              <span className="gst-otp-contact-label">Mobile</span>
              <span className="gst-otp-contact-value">{maskedMobile}</span>
            </div>
          )}
          {maskedEmail && (
            <div className="gst-otp-contact-row">
              <span className="gst-otp-contact-label">Email</span>
              <span className="gst-otp-contact-value">{maskedEmail}</span>
            </div>
          )}
        </div>
      )}

      {loading && !sent && <p className="gst-otp-msg">Sending OTP…</p>}

      {!sent && ready && !autoSend && (
        <button type="button" className="auth-submit gst-otp-send" disabled={loading} onClick={sendOtp}>
          Send OTP
        </button>
      )}

      {sent && (
        <>
          {devOtp && (
            <p className="gst-otp-dev">
              Dev OTP: <strong>{devOtp}</strong>
            </p>
          )}
          {message && <p className="gst-otp-msg">{message}</p>}
          <div className="auth-field">
            <label className="auth-label">6-digit OTP</label>
            <input
              className="auth-input gst-otp-input"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
            />
          </div>
          <div className="gst-otp-actions">
            <button type="button" className="auth-submit" disabled={loading || otp.length !== 6} onClick={verifyOtp}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button type="button" className="gst-otp-resend" disabled={loading} onClick={sendOtp}>
              Resend OTP
            </button>
          </div>
        </>
      )}
    </div>
  );
}

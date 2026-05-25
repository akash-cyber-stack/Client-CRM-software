import { useId, useRef } from 'react';
import {
  DEMO_COMPANIES,
  formatGstinDisplay,
  getGstStateLabel,
  isValidGstinFormat,
  normalizeGstin,
} from '../../utils/gstinClient';

export default function GstinVaultInput({
  value,
  onChange,
  onVerify,
  verifying,
  verified,
  legalName,
  error,
}) {
  const id = useId();
  const inputRef = useRef(null);
  const gstin = normalizeGstin(value);
  const len = gstin.length;
  const formatOk = len === 15 && isValidGstinFormat(gstin);
  const stateName = getGstStateLabel(gstin);

  const segments = Array.from({ length: 15 }, (_, i) => gstin[i] || '');

  return (
    <div className={`gst-vault ${verified ? 'gst-vault--verified' : ''} ${error ? 'gst-vault--error' : ''}`}>
      <div className="gst-vault-head">
        <div className="gst-vault-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <p className="gst-vault-kicker">Workspace Passport</p>
          <h2 className="gst-vault-title">Company GSTIN</h2>
          <p className="gst-vault-desc">Har company ka alag secure workspace — pehle GST verify, phir login.</p>
        </div>
      </div>

      <label className="sr-only" htmlFor={id}>
        15-character GST number
      </label>
      <div
        className="gst-vault-input-wrap"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="gst-vault-input"
          value={formatGstinDisplay(gstin)}
          onChange={(e) => {
            const next = normalizeGstin(e.target.value).slice(0, 15);
            onChange(next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && formatOk && !verified) {
              e.preventDefault();
              onVerify?.();
            }
          }}
          placeholder="27 AABCU 9603 R 1 Z P"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          maxLength={21}
          disabled={verified}
        />
        {stateName && len >= 2 && (
          <span className="gst-vault-state">{stateName}</span>
        )}
      </div>

      <div className="gst-vault-segments" aria-hidden="true">
        {segments.map((ch, i) => (
          <span
            key={i}
            className={`gst-seg ${ch ? 'gst-seg--filled' : ''} ${i === len ? 'gst-seg--cursor' : ''}`}
          >
            {ch || '·'}
          </span>
        ))}
      </div>

      <div className="gst-vault-meta">
        <span className={formatOk ? 'text-emerald-500' : 'text-muted'}>
          {len}/15 {formatOk ? '· Format OK' : 'characters'}
        </span>
      </div>

      {!verified && (
        <div className="gst-demo-picks">
          <p className="gst-demo-picks-label">Quick demo (valid GST)</p>
          <div className="gst-demo-picks-grid">
            {DEMO_COMPANIES.map((d) => (
              <button
                key={d.gstin}
                type="button"
                className="gst-demo-pick"
                onClick={() => onChange(d.gstin)}
              >
                <span className="gst-demo-pick-title">{d.label}</span>
                <span className="gst-demo-pick-gst">{d.gstin}</span>
                <span className="gst-demo-pick-hint">{d.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!verified && (
        <button
          type="button"
          className="gst-vault-verify-btn"
          onClick={onVerify}
          disabled={verifying || !formatOk}
        >
          {verifying ? (
            <span className="gst-vault-verify-loading">
              <span className="gst-spinner" />
              Verifying with registry…
            </span>
          ) : (
            'Verify GST & unlock workspace'
          )}
        </button>
      )}

      {verified && (
        <div className="gst-vault-success">
          <span className="gst-vault-success-icon">✓</span>
          <div>
            <p className="gst-vault-success-title">GST verified</p>
            {legalName && <p className="gst-vault-success-sub">{legalName}</p>}
          </div>
          <button
            type="button"
            className="gst-vault-change"
            onClick={() => {
              onChange('');
            }}
          >
            Change GST
          </button>
        </div>
      )}

      {error && !verified && <p className="gst-vault-error">{error}</p>}
    </div>
  );
}

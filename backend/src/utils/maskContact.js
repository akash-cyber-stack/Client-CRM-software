/** Mask phone for UI: +91 •••• ••210 */
export function maskPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  if (digits.length >= 10) {
    return `+91 •••• ••${last4}`;
  }
  return `•••• ${last4}`;
}

/** Mask email: a•••@domain.com */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.toLowerCase().split('@');
  if (!local || !domain) return null;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}•••@${domain}`;
}

export function normalizeIndianMobile(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : null;
}

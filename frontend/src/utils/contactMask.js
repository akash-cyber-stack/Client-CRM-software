export function maskPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  if (digits.length >= 10) return `+91 •••• ••${last4}`;
  return `•••• ${last4}`;
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.toLowerCase().split('@');
  if (!local || !domain) return null;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}•••@${domain}`;
}

const KEY = 'crm-phone-verify';
const MAX_AGE_MS = 15 * 60 * 1000;

export function savePhoneVerify(token, phone) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({ token, phone, at: Date.now() })
  );
}

export function getPhoneVerify() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPhoneVerify() {
  sessionStorage.removeItem(KEY);
}

export function normalizePhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : '';
}

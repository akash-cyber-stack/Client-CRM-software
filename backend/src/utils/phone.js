/** Normalize phone to digits only for matching */
export function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

export function isValidPhone(phone) {
  const normalized = normalizePhone(phone);
  return normalized.length >= 10;
}

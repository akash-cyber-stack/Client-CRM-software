const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeGstin(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function isValidGstinFormat(gstin) {
  if (!GSTIN_REGEX.test(gstin)) return false;
  return validateGstinChecksum(gstin);
}

function validateGstinChecksum(gstin) {
  let factor = 2;
  let sum = 0;
  const mod = 36;

  for (let i = 0; i < 14; i += 1) {
    const codePoint = GSTIN_CHARS.indexOf(gstin[i]);
    if (codePoint < 0) return false;
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / mod) + (addend % mod);
    sum += addend;
  }

  const checkCodePoint = (mod - (sum % mod)) % mod;
  return GSTIN_CHARS[checkCodePoint] === gstin[14];
}

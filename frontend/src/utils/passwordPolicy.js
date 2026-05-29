const MIN_LEN = 6;
const MAX_LEN = 12;
const SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/;

export function checkPassword(password) {
  const p = String(password || '');
  const checks = {
    length: p.length >= MIN_LEN && p.length <= MAX_LEN,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: SPECIAL.test(p),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    valid: score === 5,
    score,
    min: MIN_LEN,
    max: MAX_LEN,
  };
}

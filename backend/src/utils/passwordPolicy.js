const MIN_LEN = 6;
const MAX_LEN = 12;
const SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/;

export function validatePassword(password) {
  const p = String(password || '');
  const errors = [];

  if (p.length < MIN_LEN || p.length > MAX_LEN) {
    errors.push(`Password must be ${MIN_LEN}–${MAX_LEN} characters`);
  }
  if (!/[A-Z]/.test(p)) errors.push('Include at least one uppercase letter');
  if (!/[a-z]/.test(p)) errors.push('Include at least one lowercase letter');
  if (!/[0-9]/.test(p)) errors.push('Include at least one number');
  if (!SPECIAL.test(p)) errors.push('Include a special symbol (e.g. #, @, !)');

  return {
    valid: errors.length === 0,
    errors,
    min: MIN_LEN,
    max: MAX_LEN,
  };
}

export function assertPassword(password) {
  const result = validatePassword(password);
  if (!result.valid) {
    throw Object.assign(new Error(result.errors[0] || 'Password does not meet requirements'), {
      statusCode: 400,
      code: 'PASSWORD_POLICY',
      errors: result.errors,
    });
  }
}

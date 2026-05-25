const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** AR Group — existing leads/users in Neon (Default Organization) */
export const DEMO_GSTIN = '27AABCU9603R1ZP';

/** Second tenant — empty workspace for testing isolation (register via New company tab) */
export const DEMO_GSTIN_B = '06AABCT5557R1ZP';

export const DEMO_COMPANIES = [
  {
    gstin: DEMO_GSTIN,
    label: 'AR Group (existing 26 leads)',
    hint: 'Maharashtra · purana data yahi hai',
  },
  {
    gstin: DEMO_GSTIN_B,
    label: 'Sunrise Edu Demo (naya company)',
    hint: 'Gujarat · khali workspace — New company se register',
  },
];

export const GST_STATE_NAMES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export function normalizeGstin(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

function validateChecksum(gstin) {
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

export function isValidGstinFormat(gstin) {
  if (!GSTIN_REGEX.test(gstin)) return false;
  return validateChecksum(gstin);
}

export function getGstStateLabel(gstin) {
  const code = normalizeGstin(gstin).slice(0, 2);
  return GST_STATE_NAMES[code] || null;
}

export function formatGstinDisplay(gstin) {
  const g = normalizeGstin(gstin);
  if (g.length <= 2) return g;
  if (g.length <= 7) return `${g.slice(0, 2)} ${g.slice(2)}`;
  if (g.length <= 11) return `${g.slice(0, 2)} ${g.slice(2, 7)} ${g.slice(7)}`;
  if (g.length <= 12) return `${g.slice(0, 2)} ${g.slice(2, 7)} ${g.slice(7, 11)} ${g.slice(11)}`;
  if (g.length <= 13) return `${g.slice(0, 2)} ${g.slice(2, 7)} ${g.slice(7, 11)} ${g.slice(11, 12)} ${g.slice(12)}`;
  if (g.length <= 14) {
    return `${g.slice(0, 2)} ${g.slice(2, 7)} ${g.slice(7, 11)} ${g.slice(11, 12)} ${g.slice(12, 13)} ${g.slice(13)}`;
  }
  return `${g.slice(0, 2)} ${g.slice(2, 7)} ${g.slice(7, 11)} ${g.slice(11, 12)} ${g.slice(12, 13)} ${g.slice(13, 14)} ${g.slice(14)}`;
}

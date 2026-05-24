import * as XLSX from 'xlsx';

/** Normalize header cell → lowercase alphanumeric key for alias lookup */
function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const COLUMN_ALIASES = {
  // Name
  customername: 'customerName',
  name: 'customerName',
  customer: 'customerName',
  fullname: 'customerName',
  leadname: 'customerName',
  contactname: 'customerName',
  clientname: 'customerName',
  applicantname: 'customerName',
  firstname: '_firstName',
  lastname: '_lastName',

  // Phone
  phone: 'phone',
  mobile: 'phone',
  phonenumber: 'phone',
  phoneno: 'phone',
  mobileno: 'phone',
  mobilenumber: 'phone',
  contactnumber: 'phone',
  contactno: 'phone',
  whatsapp: 'phone',
  whatsappnumber: 'phone',

  // Contact & location
  email: 'email',
  emailaddress: 'email',
  city: 'city',
  state: 'city',
  location: 'city',

  // Requirements (CRM + Meta / Google lead forms)
  requirement: 'requirement',
  requirements: 'requirement',
  whichcountrydoyoupreferformbbs: 'countryPref',
  prefercountry: 'countryPref',
  countrypreference: 'countryPref',
  mbbscountry: 'countryPref',
  budget: 'budget',

  // Source / campaign
  source: 'source',
  platform: 'platform',
  campaignname: 'campaignName',
  campaign: 'campaignName',
  adname: 'adName',
  formname: 'formName',

  status: 'status',
  notes: 'notes',
  note: 'notes',
  remarks: 'notes',
};

function buildColumnMap(headerRow) {
  const map = {};
  headerRow.forEach((cell, index) => {
    const key = COLUMN_ALIASES[normalizeHeader(cell)];
    if (key && map[key] === undefined) map[key] = index;
  });
  return map;
}

function rowToLead(cells, colMap, rowNumber) {
  const get = (key) => {
    const idx = colMap[key];
    if (idx === undefined) return '';
    const v = cells[idx];
    return v == null ? '' : String(v).trim();
  };

  let customerName = get('customerName');
  if (!customerName) {
    const first = get('_firstName');
    const last = get('_lastName');
    customerName = [first, last].filter(Boolean).join(' ').trim();
  }

  let requirement = get('requirement');
  const countryPref = get('countryPref');
  const budget = get('budget');
  const reqParts = [requirement, countryPref, budget].filter(Boolean);
  requirement = reqParts.join(' · ');

  let source = get('source') || 'MANUAL';
  const platform = get('platform').toLowerCase();
  if ((!source || source === 'MANUAL') && ['fb', 'ig', 'facebook', 'instagram', 'meta'].includes(platform)) {
    source = 'META_ADS';
  }

  let notes = get('notes');
  const adName = get('adName');
  const formName = get('formName');
  const metaBits = [adName && `Ad: ${adName}`, formName && `Form: ${formName}`].filter(Boolean);
  if (metaBits.length) {
    notes = [notes, metaBits.join(' · ')].filter(Boolean).join(' | ');
  }

  return {
    rowNumber,
    customerName,
    phone: get('phone'),
    email: get('email'),
    city: get('city'),
    requirement,
    source,
    campaignName: get('campaignName'),
    status: get('status') || 'ASSIGNED',
    notes,
  };
}

function validateClientRow(lead) {
  const phone = String(lead.phone || '').replace(/\D/g, '');
  if (!lead.phone?.trim()) return 'Phone number is required';
  if (phone.length < 10) return 'Invalid phone (min 10 digits)';
  if (!lead.customerName?.trim()) return 'Customer name is required';
  return null;
}

/**
 * @returns {Promise<{ valid: object[], invalid: { row: object, reason: string }[], total: number }>}
 */
export function parseLeadsFromFile(file) {
  return new Promise((resolve, reject) => {
    const isCsv = /\.csv$/i.test(file.name) || file.type?.includes('csv');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = isCsv
          ? XLSX.read(String(e.target.result), { type: 'string' })
          : XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows.length) {
          resolve({ valid: [], invalid: [], total: 0 });
          return;
        }

        const headerRow = rows[0];
        const colMap = buildColumnMap(headerRow);
        const hasHeader =
          colMap.phone !== undefined ||
          colMap.customerName !== undefined ||
          colMap._firstName !== undefined;
        const dataRows = hasHeader ? rows.slice(1) : rows;

        const valid = [];
        const invalid = [];

        dataRows.forEach((cells, idx) => {
          const rowNumber = hasHeader ? idx + 2 : idx + 1;
          const empty = !cells || cells.every((c) => !String(c ?? '').trim());
          if (empty) return;

          const lead = hasHeader
            ? rowToLead(cells, colMap, rowNumber)
            : {
                rowNumber,
                customerName: String(cells[0] ?? '').trim(),
                phone: String(cells[1] ?? '').trim(),
                email: String(cells[2] ?? '').trim(),
                city: String(cells[3] ?? '').trim(),
                requirement: String(cells[4] ?? '').trim(),
                source: String(cells[5] ?? 'MANUAL').trim() || 'MANUAL',
                campaignName: String(cells[6] ?? '').trim(),
                status: String(cells[7] ?? 'ASSIGNED').trim() || 'ASSIGNED',
                notes: String(cells[8] ?? '').trim(),
              };

          const err = validateClientRow(lead);
          if (err) invalid.push({ row: lead, rowNumber, reason: err });
          else valid.push(lead);
        });

        resolve({ valid, invalid, total: valid.length + invalid.length });
      } catch {
        reject(new Error('Could not read file. Use .xlsx or .csv with the sample template columns.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    if (isCsv) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

import * as XLSX from 'xlsx';

/** Maps normalized header → internal field (first match wins). */
const COLUMN_ALIASES = {
  customername: 'customerName',
  name: 'customerName',
  fullname: 'customerName',
  contactname: 'customerName',
  leadname: 'customerName',
  clientname: 'customerName',
  applicantname: 'customerName',
  studentname: 'customerName',
  candidatename: 'customerName',

  phone: 'phone',
  phonenumber: 'phone',
  mobilenumber: 'phone',
  mobile: 'phone',
  contactnumber: 'phone',
  contactno: 'phone',
  contact: 'phone',
  whatsapp: 'phone',
  whatsappnumber: 'phone',
  tel: 'phone',
  telephone: 'phone',

  email: 'email',
  emailaddress: 'email',
  mail: 'email',

  city: 'city',
  state: 'city',
  location: 'city',
  region: 'city',
  district: 'city',

  requirement: 'requirement',
  requirements: 'requirement',
  message: 'requirement',
  query: 'requirement',
  interestedin: 'requirement',

  campaignname: 'campaignName',
  campaign: 'campaignName',

  notes: 'notes',
  note: 'notes',
  remarks: 'notes',
  comment: 'notes',
};

/** Known extra columns → readable note labels (ads / form exports). */
const LABELED_EXTRA_FIELDS = {
  platform: 'Platform',
  budget: 'Budget',
  whichcountrydoyoupreferformbbs: 'Country preference',
  formname: 'Form',
  adname: 'Ad',
  adsetname: 'Ad set',
};

/** Headers we skip when auto-building notes (IDs, internal ad fields). */
const SKIP_AUTO_NOTE = /^(id|createdtime|created|adid|adsetid|campaignid|formid|isorganic)$/;

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function humanizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\?/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 48);
}

function buildColumnMap(headerRow) {
  const map = {};
  const extraNoteColumns = [];

  headerRow.forEach((cell, index) => {
    const norm = normalizeHeader(cell);
    if (!norm) return;

    const field = COLUMN_ALIASES[norm];
    if (field) {
      if (map[field] === undefined) map[field] = index;
      return;
    }

    if (SKIP_AUTO_NOTE.test(norm)) return;

    const label = LABELED_EXTRA_FIELDS[norm] || humanizeHeader(cell);
    if (label) extraNoteColumns.push({ index, label });
  });

  return { map, extraNoteColumns };
}

function looksLikeHeaderRow(row) {
  if (!row?.length) return false;
  const norms = row.map((c) => normalizeHeader(c)).filter(Boolean);
  const hasPhone = norms.some((n) => COLUMN_ALIASES[n] === 'phone');
  const hasName = norms.some((n) => COLUMN_ALIASES[n] === 'customerName');
  const hasEmail = norms.some((n) => COLUMN_ALIASES[n] === 'email');
  return hasPhone || hasName || (hasEmail && norms.length >= 3);
}

function deriveName(customerName, email, phone) {
  if (customerName?.trim()) return customerName.trim();
  if (email?.trim()) {
    const local = email.split('@')[0].replace(/[._+-]+/g, ' ').trim();
    if (local.length >= 2) return local.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 4) return `Lead ${digits.slice(-4)}`;
  return '';
}

function rowToLead(cells, colMap, extraNoteColumns, rowNumber) {
  const get = (key) => {
    const idx = colMap[key];
    if (idx === undefined) return '';
    const v = cells[idx];
    return v == null ? '' : String(v).trim();
  };

  const phone = get('phone');
  const email = get('email');
  const customerName = deriveName(get('customerName'), email, phone);

  const noteParts = [];
  const existingNotes = get('notes');
  if (existingNotes) noteParts.push(existingNotes);

  extraNoteColumns.forEach(({ index, label }) => {
    const v = cells[index];
    if (v == null || !String(v).trim()) return;
    noteParts.push(`${label}: ${String(v).trim()}`);
  });

  let requirement = get('requirement');
  if (!requirement) {
    const reqBits = [];
    extraNoteColumns.forEach(({ index, label }) => {
      const v = cells[index];
      if (v == null || !String(v).trim()) return;
      if (label === 'Country preference' || label === 'Budget') {
        reqBits.push(String(v).trim());
      }
    });
    requirement = reqBits.join(' · ');
  }

  return {
    rowNumber,
    customerName,
    phone,
    email,
    city: get('city'),
    requirement,
    source: 'MANUAL',
    campaignName: get('campaignName'),
    status: 'ASSIGNED',
    notes: noteParts.join(' | '),
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

        const firstRow = rows[0];
        const { map: colMap, extraNoteColumns } = buildColumnMap(firstRow);
        const hasHeader = looksLikeHeaderRow(firstRow);
        const dataRows = hasHeader ? rows.slice(1) : rows;

        const valid = [];
        const invalid = [];

        dataRows.forEach((cells, idx) => {
          const rowNumber = hasHeader ? idx + 2 : idx + 1;
          const empty = !cells || cells.every((c) => !String(c ?? '').trim());
          if (empty) return;

          const lead = hasHeader
            ? rowToLead(cells, colMap, extraNoteColumns, rowNumber)
            : {
                rowNumber,
                customerName: deriveName(String(cells[0] ?? '').trim(), String(cells[2] ?? ''), String(cells[1] ?? '')),
                phone: String(cells[1] ?? '').trim(),
                email: String(cells[2] ?? '').trim(),
                city: String(cells[3] ?? '').trim(),
                requirement: String(cells[4] ?? '').trim(),
                source: 'MANUAL',
                campaignName: String(cells[5] ?? '').trim(),
                status: 'ASSIGNED',
                notes: String(cells[6] ?? '').trim(),
              };

          const err = validateClientRow(lead);
          if (err) invalid.push({ row: lead, rowNumber, reason: err });
          else valid.push(lead);
        });

        resolve({ valid, invalid, total: valid.length + invalid.length });
      } catch {
        reject(new Error('Could not read file. Use .xlsx or .csv (export from spreadsheet or our template).'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    if (isCsv) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

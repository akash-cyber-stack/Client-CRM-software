import * as XLSX from 'xlsx';

const COLUMN_ALIASES = {
  customername: 'customerName',
  name: 'customerName',
  customer: 'customerName',
  phone: 'phone',
  mobile: 'phone',
  phonenumber: 'phone',
  email: 'email',
  city: 'city',
  requirement: 'requirement',
  requirements: 'requirement',
  source: 'source',
  campaignname: 'campaignName',
  campaign: 'campaignName',
  status: 'status',
  notes: 'notes',
  note: 'notes',
  remarks: 'notes',
};

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function buildColumnMap(headerRow) {
  const map = {};
  headerRow.forEach((cell, index) => {
    const key = COLUMN_ALIASES[normalizeHeader(cell)];
    if (key) map[key] = index;
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

  return {
    rowNumber,
    customerName: get('customerName'),
    phone: get('phone'),
    email: get('email'),
    city: get('city'),
    requirement: get('requirement'),
    source: get('source') || 'MANUAL',
    campaignName: get('campaignName'),
    status: get('status') || 'ASSIGNED',
    notes: get('notes'),
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
        const hasHeader = colMap.phone !== undefined || colMap.customerName !== undefined;
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

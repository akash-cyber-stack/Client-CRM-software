import * as XLSX from 'xlsx';

const COLUMN_ALIASES = {
  name: 'name',
  fullname: 'name',
  full_name: 'name',
  employeeName: 'name',
  employee: 'name',

  email: 'email',
  emailaddress: 'email',
  mail: 'email',

  phone: 'phone',
  phone_number: 'phone',
  mobilenumber: 'phone',
  mobile: 'phone',

  password: 'password',
  pass: 'password',
  pwd: 'password',
  temporarypassword: 'password',

  role: 'role',
  designation: 'role',

  department: 'department',

  status: 'status',

  ivragentid: 'ivrAgentId',
  ivragent: 'ivrAgentId',
  agentid: 'ivrAgentId',

  ivrextension: 'ivrExtension',
  extension: 'ivrExtension',
};

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function looksLikeHeaderRow(row) {
  if (!row?.length) return false;
  const normalized = row.map((cell) => normalizeHeader(cell)).filter(Boolean);
  const hasName = normalized.some((item) => COLUMN_ALIASES[item] === 'name');
  const hasEmail = normalized.some((item) => COLUMN_ALIASES[item] === 'email');
  const hasPassword = normalized.some((item) => COLUMN_ALIASES[item] === 'password');
  return hasName && hasEmail && hasPassword;
}

function buildColumnMap(headerRow) {
  const map = {};

  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    if (!normalized) return;
    const field = COLUMN_ALIASES[normalized];
    if (field && map[field] === undefined) {
      map[field] = index;
    }
  });

  return map;
}

function getCell(cells, key, colMap) {
  const index = colMap[key];
  if (index === undefined) return '';
  const value = cells[index];
  return value == null ? '' : String(value).trim();
}

function rowToEmployee(cells, colMap, rowNumber) {
  return {
    rowNumber,
    name: getCell(cells, 'name', colMap),
    email: getCell(cells, 'email', colMap),
    phone: getCell(cells, 'phone', colMap),
    password: getCell(cells, 'password', colMap),
    role: getCell(cells, 'role', colMap) || 'SALES_EMPLOYEE',
    department: getCell(cells, 'department', colMap) || 'Sales',
    status: getCell(cells, 'status', colMap) || 'ACTIVE',
    ivrAgentId: getCell(cells, 'ivrAgentId', colMap),
    ivrExtension: getCell(cells, 'ivrExtension', colMap),
  };
}

function validateEmployee(employee) {
  if (!employee.name?.trim()) return 'Name is required';
  if (!employee.email?.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) return 'Invalid email';
  if (!employee.password?.trim()) return 'Password is required';
  if (employee.role === 'SUPER_ADMIN') return 'Super Admin cannot be imported';
  if (!['ACTIVE', 'INACTIVE'].includes(employee.status.toUpperCase())) return 'Status must be ACTIVE or INACTIVE';
  return null;
}

export function parseEmployeesFromFile(file) {
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
        const hasHeader = looksLikeHeaderRow(firstRow);
        const dataRows = hasHeader ? rows.slice(1) : rows;
        const colMap = hasHeader ? buildColumnMap(firstRow) : {
          name: 0,
          email: 1,
          phone: 2,
          password: 3,
          role: 4,
          department: 5,
          status: 6,
          ivrAgentId: 7,
          ivrExtension: 8,
        };

        const valid = [];
        const invalid = [];

        dataRows.forEach((cells, idx) => {
          const rowNumber = hasHeader ? idx + 2 : idx + 1;
          const empty = !cells || cells.every((cell) => !String(cell ?? '').trim());
          if (empty) return;

          const employee = rowToEmployee(cells, colMap, rowNumber);
          const reason = validateEmployee(employee);
          if (reason) invalid.push({ row: employee, rowNumber, reason });
          else valid.push(employee);
        });

        resolve({ valid, invalid, total: valid.length + invalid.length });
      } catch {
        reject(new Error('Could not read file. Use .xlsx or .csv.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    if (isCsv) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

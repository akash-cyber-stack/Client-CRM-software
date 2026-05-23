import * as XLSX from 'xlsx';

export const IMPORT_TEMPLATE_COLUMNS = [
  'customerName',
  'phone',
  'email',
  'city',
  'requirement',
  'source',
  'campaignName',
  'notes',
];

const SAMPLE_ROWS = [
  ['Rahul Sharma', '9876543210', 'rahul@example.com', 'Delhi', '2BHK flat', 'MANUAL', 'Summer Campaign', 'Hot lead'],
  ['Priya Singh', '9123456780', '', 'Mumbai', 'Loan inquiry', 'GOOGLE_ADS', 'Google Search', ''],
];

export function downloadLeadImportTemplate(format = 'xlsx') {
  const header = IMPORT_TEMPLATE_COLUMNS;
  const rows = [header, ...SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'lead-import-template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'lead-import-template.xlsx');
  }
}

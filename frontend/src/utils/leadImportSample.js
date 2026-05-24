import * as XLSX from 'xlsx';

export const IMPORT_TEMPLATE_COLUMNS = [
  'customerName',
  'phone',
  'email',
  'city',
  'requirement',
  'campaignName',
  'notes',
];

/** Simple template rows */
const SIMPLE_ROWS = [
  ['Rahul Sharma', '9876543210', 'rahul@example.com', 'Delhi', 'MBBS abroad', 'Summer Campaign', 'Hot lead'],
  ['Priya Singh', '9123456780', '', 'Mumbai', 'Loan inquiry', 'Referral', ''],
];

/** Common spreadsheet export headers (reference only — any similar file works) */
const EXPORT_FORMAT_HEADERS = [
  'full_name',
  'phone_number',
  'email',
  'state',
  'campaign_name',
  'platform',
  'budget?',
  'which_country_do_you_prefer_for_mbbs?',
];

const EXPORT_FORMAT_SAMPLE = [
  ['Anil Kumar', '+919876543210', 'anil@example.com', 'UP', 'MBBS Campaign', 'fb', '15-20_lakhs', 'russia'],
];

export function downloadLeadImportTemplate(format = 'xlsx') {
  const wb = XLSX.utils.book_new();

  const simpleWs = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_COLUMNS, ...SIMPLE_ROWS]);
  XLSX.utils.book_append_sheet(wb, simpleWs, 'Simple template');

  const exportWs = XLSX.utils.aoa_to_sheet([EXPORT_FORMAT_HEADERS, ...EXPORT_FORMAT_SAMPLE]);
  XLSX.utils.book_append_sheet(wb, exportWs, 'Export format example');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'lead-import-template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'lead-import-template.xlsx');
  }
}

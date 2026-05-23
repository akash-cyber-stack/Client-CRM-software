import { useState } from 'react';
import Modal from './Modal';
import { parseLeadsFromFile } from '../utils/parseLeadsFile';
import { downloadLeadImportTemplate } from '../utils/leadImportSample';
import { leadsApi } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { SOURCE_LABELS } from '../utils/constants';

export default function ImportLeadsModal({ open, onClose, employees, onSuccess }) {
  const toast = useToast();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [assignMode, setAssignMode] = useState('ROUND_ROBIN');
  const [assignToId, setAssignToId] = useState('');
  const [summary, setSummary] = useState(null);
  const [fileError, setFileError] = useState('');

  const salesEmployees = employees.filter((e) => e.role === 'SALES_EMPLOYEE' && e.status === 'ACTIVE');

  const reset = () => {
    setValidRows([]);
    setInvalidRows([]);
    setAssignMode('ROUND_ROBIN');
    setAssignToId('');
    setSummary(null);
    setFileError('');
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    setSummary(null);
    setParsing(true);
    try {
      const result = await parseLeadsFromFile(file);
      setValidRows(result.valid);
      setInvalidRows(result.invalid);
      if (!result.valid.length && !result.invalid.length) {
        setFileError('No data rows found in file.');
      }
    } catch (err) {
      setFileError(err.message || 'Failed to parse file');
      setValidRows([]);
      setInvalidRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!validRows.length) {
      toast.error('No valid rows to import');
      return;
    }
    if (assignMode === 'ASSIGN_TO' && !assignToId) {
      toast.error('Select a sales employee to assign leads');
      return;
    }

    setImporting(true);
    try {
      const res = await leadsApi.bulkImport({
        leads: validRows,
        assignmentMode: assignMode,
        assignToEmployeeId: assignMode === 'ASSIGN_TO' ? assignToId : undefined,
      });
      const data = res.data.data;
      setSummary(data);
      toast.success(`Imported ${data.importedCount} of ${data.totalRows} rows`);
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Leads" size="xl">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Upload Excel (.xlsx) or CSV. Preview rows, then import. Duplicate phones are skipped.
        </p>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => downloadLeadImportTemplate('xlsx')}>
            Download Sample Excel
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => downloadLeadImportTemplate('csv')}>
            Download Sample CSV
          </button>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="input w-full"
          disabled={parsing || importing}
          onChange={onFileChange}
        />

        {parsing && <p className="text-sm text-muted">Parsing file…</p>}
        {fileError && <div className="alert-error text-sm">{fileError}</div>}

        {(validRows.length > 0 || invalidRows.length > 0) && !summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <p className="text-muted">Valid rows</p>
                <p className="text-xl font-bold text-emerald-400">{validRows.length}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <p className="text-muted">Invalid rows</p>
                <p className="text-xl font-bold text-red-400">{invalidRows.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-main">Assign To</label>
              <select
                className="input w-full"
                value={assignMode === 'ROUND_ROBIN' ? 'ROUND_ROBIN' : assignToId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'ROUND_ROBIN') {
                    setAssignMode('ROUND_ROBIN');
                    setAssignToId('');
                  } else {
                    setAssignMode('ASSIGN_TO');
                    setAssignToId(v);
                  }
                }}
              >
                <option value="ROUND_ROBIN">Auto Assign (Round Robin)</option>
                {salesEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {validRows.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-main mb-2">Preview — valid rows ({validRows.length})</h3>
                <div className="overflow-x-auto max-h-48 rounded-lg border border-default">
                  <table className="w-full text-xs min-w-[720px]">
                    <thead className="sticky top-0" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                      <tr className="text-left text-muted border-b">
                        <th className="p-2">#</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">City</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Campaign</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 100).map((r) => (
                        <tr key={r.rowNumber} className="border-b border-default">
                          <td className="p-2">{r.rowNumber}</td>
                          <td className="p-2">{r.customerName}</td>
                          <td className="p-2">{r.phone}</td>
                          <td className="p-2">{r.email || '-'}</td>
                          <td className="p-2">{r.city || '-'}</td>
                          <td className="p-2">{SOURCE_LABELS[r.source] || r.source}</td>
                          <td className="p-2">{r.campaignName || '-'}</td>
                          <td className="p-2">{r.status?.replace(/_/g, ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validRows.length > 100 && (
                  <p className="text-xs text-muted mt-1">Showing first 100 of {validRows.length} valid rows.</p>
                )}
              </div>
            )}

            {invalidRows.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">Invalid rows ({invalidRows.length})</h3>
                <div className="overflow-x-auto max-h-32 rounded-lg border border-red-500/30">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted border-b">
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">Phone</th>
                        <th className="p-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidRows.slice(0, 50).map((item) => (
                        <tr key={item.rowNumber} className="border-b border-default">
                          <td className="p-2">{item.rowNumber}</td>
                          <td className="p-2">{item.row?.phone || '-'}</td>
                          <td className="p-2 text-red-400">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={importing || !validRows.length || (assignMode === 'ASSIGN_TO' && !assignToId)}
              onClick={handleImport}
            >
              {importing ? 'Importing…' : `Import ${validRows.length} lead(s)`}
            </button>
          </>
        )}

        {summary && (
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <h3 className="font-semibold text-main">Import complete</h3>
            <ul className="text-sm space-y-1 text-muted">
              <li>Total rows: <strong className="text-main">{summary.totalRows}</strong></li>
              <li>Imported: <strong className="text-emerald-400">{summary.importedCount}</strong></li>
              <li>Duplicates skipped: <strong className="text-amber-400">{summary.duplicateCount}</strong></li>
              <li>Failed: <strong className="text-red-400">{summary.failedCount}</strong></li>
            </ul>
            <button type="button" className="btn-primary w-full mt-2" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

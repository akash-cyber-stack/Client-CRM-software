import { useMemo, useState } from 'react';
import Modal from './Modal';
import { parseEmployeesFromFile } from '../utils/parseEmployeesFile';
import { employeesApi } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { remainingUserSlots } from '../utils/planLimits';

export default function ImportEmployeesModal({
  open,
  onClose,
  onSuccess,
  plan,
  seatsUsed = 0,
  seatsMax = null,
  slotsLeft: slotsLeftProp,
}) {
  const toast = useToast();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fileError, setFileError] = useState('');

  const slotsLeft = useMemo(() => {
    if (slotsLeftProp != null && Number.isFinite(slotsLeftProp)) return slotsLeftProp;
    return remainingUserSlots(plan, seatsUsed);
  }, [slotsLeftProp, plan, seatsUsed]);

  const cappedImport = useMemo(() => {
    if (slotsLeft === Infinity) return validRows;
    return validRows.slice(0, Math.max(0, slotsLeft));
  }, [validRows, slotsLeft]);

  const skippedByPlan = validRows.length - cappedImport.length;

  const reset = () => {
    setValidRows([]);
    setInvalidRows([]);
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
      const result = await parseEmployeesFromFile(file);
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
    if (!cappedImport.length) {
      toast.error(
        seatsMax != null
          ? `No seats left (${seatsUsed}/${seatsMax} users including Super Admin). Remove users or upgrade plan.`
          : 'No valid rows to import'
      );
      return;
    }

    setImporting(true);
    try {
      const res = await employeesApi.import({ employees: cappedImport });
      const data = res.data.data;
      setSummary(data);
      const skipped = (data.skippedDueToPlanLimit || 0) + skippedByPlan;
      toast.success(
        skipped > 0
          ? `Imported ${data.createdCount}; ${skipped} row(s) skipped (plan limit)`
          : `Imported ${data.createdCount} employee(s)`
      );
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Employees" size="xl">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Upload Excel or CSV with <strong>name</strong>, <strong>email</strong>, <strong>password</strong>, etc.
          Super Admin already uses one seat — only remaining slots are imported.
        </p>

        {seatsMax != null && (
          <p className="text-sm rounded-lg px-3 py-2 border border-default" style={{ backgroundColor: 'var(--surface-hover)' }}>
            Plan seats: <strong className="text-main">{seatsUsed}</strong> / {seatsMax} used
            {slotsLeft > 0 ? (
              <> — import will accept at most <strong className="text-emerald-400">{slotsLeft}</strong> new row(s)</>
            ) : (
              <span className="text-amber-400"> — no seats available</span>
            )}
          </p>
        )}

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
                <p className="text-muted">Will import</p>
                <p className="text-xl font-bold text-emerald-400">{cappedImport.length}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <p className="text-muted">Invalid rows</p>
                <p className="text-xl font-bold text-red-400">{invalidRows.length}</p>
              </div>
              {skippedByPlan > 0 && (
                <div className="rounded-lg p-3 border border-amber-500/30" style={{ backgroundColor: 'var(--surface-hover)' }}>
                  <p className="text-muted">Skipped (plan)</p>
                  <p className="text-xl font-bold text-amber-400">{skippedByPlan}</p>
                </div>
              )}
            </div>

            {cappedImport.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-main mb-2">
                  Preview — importing {cappedImport.length} row(s)
                </h3>
                <div className="overflow-x-auto max-h-48 rounded-lg border border-default">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead className="sticky top-0" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                      <tr className="text-left text-muted border-b">
                        <th className="p-2">Row</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cappedImport.slice(0, 100).map((row) => (
                        <tr key={row.rowNumber} className="border-b border-default">
                          <td className="p-2">{row.rowNumber}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2">{row.role.replace(/_/g, ' ')}</td>
                          <td className="p-2">{row.department}</td>
                          <td className="p-2">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidRows.slice(0, 50).map((item) => (
                        <tr key={item.rowNumber} className="border-b border-default">
                          <td className="p-2">{item.rowNumber}</td>
                          <td className="p-2">{item.row?.name || '-'}</td>
                          <td className="p-2">{item.row?.email || '-'}</td>
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
              disabled={importing || !cappedImport.length}
              onClick={handleImport}
            >
              {importing ? 'Importing…' : `Import ${cappedImport.length} employee(s)`}
            </button>
          </>
        )}

        {summary && (
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <h3 className="font-semibold text-main">Import complete</h3>
            <ul className="text-sm space-y-1 text-muted">
              <li>
                Created: <strong className="text-emerald-400">{summary.createdCount}</strong>
              </li>
              <li>
                Duplicates skipped: <strong className="text-amber-400">{summary.duplicateCount}</strong>
              </li>
              {(summary.skippedDueToPlanLimit || 0) > 0 && (
                <li>
                  Skipped (plan limit):{' '}
                  <strong className="text-amber-400">{summary.skippedDueToPlanLimit}</strong>
                </li>
              )}
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

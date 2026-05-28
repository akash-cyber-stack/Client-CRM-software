import { useMemo, useState } from 'react';
import Modal from './Modal';
import { parseEmployeesFromFile } from '../utils/parseEmployeesFile';
import { employeesApi, billingApi } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { remainingUserSlots } from '../utils/planLimits';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [previewReport, setPreviewReport] = useState(null);
  const [fileError, setFileError] = useState('');
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [managerCounts, setManagerCounts] = useState({ used: 0, max: null, remaining: null });
  const [autoRetryAfterUpgrade, setAutoRetryAfterUpgrade] = useState(false);

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
    setUpgradeInfo(null);
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { setSessionFromToken } = useAuth();

  const openSubscription = () => {
    navigate('/settings');
  };

  const loadPlans = async () => {
    if (plans.length) return;
    setLoadingPlans(true);
    try {
      const res = await billingApi.plans();
      setPlans(res.data.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadManagerCounts = async () => {
    try {
      const res = await employeesApi.list();
      const employees = res.data.data || [];
      const used = employees.filter((e) => e.role === 'MANAGER').length;
      // derive max from props if provided via seatsMax and plan
      const max = seatsMax == null ? null : (() => {
        // assume plan prop maps to seat limits; fallback to null
        return null;
      })();
      setManagerCounts({ used, max, remaining: max == null ? Infinity : Math.max(0, max - used) });
    } catch (err) {
      // ignore
    }
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
      // run server-side preview for validation (duplicates, manager/seat capacity)
      if (result.valid.length) {
        try {
          const pv = await employeesApi.previewImport({ employees: result.valid });
          setPreviewReport(pv.data.data || null);
          // if preview indicates manager limit reached, surface upgrade
          if (pv.data.data?.managers?.managerRemaining !== undefined && pv.data.data.managers.managerRemaining <= 0) {
            setUpgradeInfo({ message: `Manager limit reached for ${plan}.` });
          } else {
            setUpgradeInfo(null);
          }
        } catch (err) {
          // ignore preview errors but show toast
          toast.error(getApiErrorMessage(err, 'Preview failed'));
          setPreviewReport(null);
        }
      } else {
        setPreviewReport(null);
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
      const status = err.response?.status;
      const data = err.response?.data;
      const message = getApiErrorMessage(err, 'Import failed');
      // detect plan/manager limit 403 and surface upgrade CTA
      if (status === 403 && (String(data?.message || '').toLowerCase().includes('manager') || data?.data?.skippedDueToManagerLimit || data?.code === 'PAYMENT_REQUIRED')) {
        setUpgradeInfo({ message: data?.message || message });
      } else {
        toast.error(message);
      }
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

            {upgradeInfo && (
              <div className="rounded-lg p-3 border border-amber-500/30" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <p className="text-sm text-amber-400 font-semibold">{upgradeInfo.message}</p>
                <p className="text-sm text-muted mt-2">Upgrade your plan to add more managers or seats.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => { loadPlans(); }}>
                    {loadingPlans ? 'Loading plans…' : 'Choose plan & upgrade'}
                  </button>
                  {!isSuperAdmin && (
                    <button type="button" className="btn-secondary" onClick={() => window.location.href = '/contact'}>Contact admin</button>
                  )}
                </div>

                {isSuperAdmin && plans.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plans.map((p) => (
                      <div key={p.id} className="rounded-lg p-3 border" style={{ backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-sm text-muted">{p.priceLabel || ''}</div>
                          </div>
                          <div>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={activatingPlan}
                              onClick={async () => {
                                // show confirmation modal before activating
                                setConfirmPlan(p);
                              }}
                            >
                              {activatingPlan ? 'Upgrading…' : 'Upgrade'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        {confirmPlan && (
          <Modal open={!!confirmPlan} onClose={() => setConfirmPlan(null)} title={`Activate ${confirmPlan.name}?`} size="sm">
            <p className="text-sm text-muted">Activate plan <strong>{confirmPlan.name}</strong> for this workspace? This will update your subscription immediately.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={activatingPlan}
                onClick={async () => {
                  setActivatingPlan(true);
                  try {
                    const res = await billingApi.checkout({ plan: confirmPlan.id });
                    const data = res.data.data;
                    if (data?.checkoutUrl) {
                      window.location.href = data.checkoutUrl;
                      return;
                    }
                    await billingApi.activate({ plan: confirmPlan.id, paymentId: `mock_${Date.now()}` });
                    const token = localStorage.getItem('token');
                    if (token) await setSessionFromToken(token);
                    toast.success('Plan activated');
                    setUpgradeInfo(null);
                    setConfirmPlan(null);
                    // reload manager counts and optionally auto-retry import
                    await loadManagerCounts();
                    onSuccess?.();
                    if (autoRetryAfterUpgrade) await handleImport();
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Activation failed'));
                  } finally {
                    setActivatingPlan(false);
                  }
                }}
              >
                {activatingPlan ? 'Activating…' : `Activate ${confirmPlan.name}`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setConfirmPlan(null)}>Cancel</button>
            </div>
            <label className="mt-3 text-sm text-muted flex items-center gap-2">
              <input type="checkbox" checked={autoRetryAfterUpgrade} onChange={(e) => setAutoRetryAfterUpgrade(e.target.checked)} />
              <span>Retry import automatically after successful upgrade</span>
            </label>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

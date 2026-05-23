import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { followUpsApi } from '../api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDate } from '../utils/constants';

const TABS = [
  { key: 'today', label: "Today's Follow-ups" },
  { key: 'pending', label: 'Pending' },
  { key: 'missed', label: 'Missed' },
];

export default function FollowUps() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'today';
  const [followUps, setFollowUps] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      followUpsApi.list({ type }),
      followUpsApi.dashboard(),
    ])
      .then(([listRes, dashRes]) => {
        setFollowUps(listRes.data.data);
        setDashboard(dashRes.data.data);
      })
      .catch((err) => toast.error(getApiErrorMessage(err, 'Failed to load follow-ups')))
      .finally(() => setLoading(false));
  }, [type]);

  const complete = async (id) => {
    try {
      await followUpsApi.complete(id);
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      toast.success('Follow-up completed');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not complete'));
    }
  };

  return (
    <div className="page-enter">
      <h1 className="text-2xl font-bold text-main mb-8 tracking-tight">Follow-ups</h1>

      {dashboard && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'today', count: dashboard.today, label: 'Today', color: 'text-primary-600' },
            { key: 'pending', count: dashboard.pending, label: 'Pending', color: 'text-amber-600' },
            { key: 'missed', count: dashboard.missed, label: 'Missed', color: 'text-red-600' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSearchParams({ type: item.key })}
              className={`card text-center w-full transition-all hover:border-primary-500/50 active:scale-[0.98] ${
                type === item.key ? 'ring-2 ring-primary-500 border-primary-500/50' : ''
              }`}
            >
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-sm text-muted">{item.label}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ type: t.key })}
            className={type === t.key ? 'tab-pill-active' : 'tab-pill'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {followUps.map((f) => (
            <div key={f.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link to={`/leads/${f.lead.id}`} className="font-semibold text-primary-600 hover:underline">
                  {f.lead.customerName}
                </Link>
                <p className="text-sm text-muted">{f.lead.phone} &middot; {formatDate(f.scheduledAt)}</p>
                {f.remarks && <p className="text-sm mt-1">{f.remarks}</p>}
                <p className="text-xs text-subtle">Employee: {f.employee?.name}</p>
              </div>
              <button className="btn-primary text-sm" onClick={() => complete(f.id)}>Mark Complete</button>
            </div>
          ))}
          {followUps.length === 0 && (
            <p className="text-center py-12 text-muted card">No follow-ups in this category</p>
          )}
        </div>
      )}
    </div>
  );
}

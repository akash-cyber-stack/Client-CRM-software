import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leadsApi, employeesApi, callsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import AudioPlayer from '../components/AudioPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import { LEAD_STATUSES, SOURCE_LABELS, formatDate, formatDuration } from '../utils/constants';

export default function LeadDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [lead, setLead] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState({ scheduledAt: '', remarks: '' });
  const [assignId, setAssignId] = useState('');
  const [calling, setCalling] = useState(false);
  const [callMsg, setCallMsg] = useState('');

  const load = () => leadsApi.get(id).then((res) => setLead(res.data.data));

  useEffect(() => {
    load();
    if (isAdmin) employeesApi.list().then((res) => setEmployees(res.data.data));
  }, [id, isAdmin]);

  const handleNote = async () => {
    if (!note.trim()) return;
    await leadsApi.addNote(id, note);
    setNote('');
    load();
  };

  const handleFollowUp = async () => {
    await leadsApi.addFollowUp(id, followUp);
    setFollowUp({ scheduledAt: '', remarks: '' });
    load();
  };

  const handleAssign = async () => {
    await leadsApi.assign(id, assignId);
    load();
  };

  const handleStatus = async (status) => {
    await leadsApi.update(id, { status });
    load();
  };

  const handleCall = async () => {
    setCalling(true);
    setCallMsg('');
    try {
      const res = await callsApi.initiate({ leadId: id, customerPhone: lead.phone });
      setCallMsg(res.data.message || 'Call started');
      load();
    } catch (err) {
      setCallMsg(err.response?.data?.message || 'Call failed');
    } finally {
      setCalling(false);
    }
  };

  if (!lead) return <LoadingSpinner />;

  return (
    <div className="page-enter">
      <Link to="/leads" className="text-primary-500 text-sm hover:underline mb-4 inline-block transition-colors">&larr; Back to Leads</Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-main tracking-tight">{lead.customerName}</h1>
          <p className="text-muted">Lead #{lead.leadNumber} &middot; {SOURCE_LABELS[lead.source]}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCall}
            disabled={calling}
            className="btn-primary flex items-center gap-2"
          >
            {calling ? 'Calling...' : '📞 Call via IVR'}
          </button>
          <StatusBadge status={lead.status} />
        </div>
      </div>
      {callMsg && <p className="text-sm text-main mb-4 alert-info">{callMsg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Phone</span><p className="font-medium text-main">{lead.phone}</p></div>
            <div><span className="text-muted">Email</span><p className="font-medium">{lead.email || '-'}</p></div>
            <div><span className="text-muted">City</span><p className="font-medium">{lead.city || '-'}</p></div>
            <div><span className="text-muted">Assigned To</span><p className="font-medium">{lead.assignedTo?.name || 'Unassigned'}</p></div>
            <div><span className="text-muted">Campaign</span><p className="font-medium">{lead.campaignName || '-'}</p></div>
            <div><span className="text-muted">Follow-up</span><p className="font-medium">{formatDate(lead.followUpDate)}</p></div>
            <div className="col-span-2"><span className="text-muted">Requirement</span><p className="font-medium mt-1">{lead.requirement || '-'}</p></div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4 text-main">Call History & Recordings</h2>
            {lead.callLogs?.length === 0 ? (
              <p className="text-muted text-sm">No calls yet</p>
            ) : (
              <div className="space-y-4">
                {lead.callLogs.map((c) => (
                  <div key={c.id} className="border rounded-lg p-4 flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium">{c.callType} &middot; {c.callStatus}</p>
                      <p className="text-sm text-muted">{formatDate(c.callStartTime)} &middot; {formatDuration(c.durationSeconds)}</p>
                      <p className="text-sm">Agent: {c.employee?.name || 'Unknown'}</p>
                    </div>
                    <AudioPlayer url={c.recordingUrl} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4 text-main">Timeline</h2>
            <div className="space-y-3">
              {(lead.timeline || []).map((a) => (
                <div key={a.id} className="flex gap-3 text-sm border-l-2 border-primary-200 pl-4">
                  <div>
                    <p className="font-medium">{a.type.replace(/_/g, ' ')}</p>
                    <p className="text-muted">{a.description}</p>
                    <p className="text-xs text-subtle">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-main">Assign Lead</h3>
              <select className="input" value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                <option value="">Select employee</option>
                {employees.filter((e) => e.status === 'ACTIVE').map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <button className="btn-primary w-full" onClick={handleAssign} disabled={!assignId}>Assign</button>
            </div>
          )}

          <div className="card space-y-3">
            <h3 className="font-semibold text-main">Update Status</h3>
            <select className="input" value={lead.status} onChange={(e) => handleStatus(e.target.value)}>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold text-main">Add Note</h3>
            <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-primary w-full" onClick={handleNote}>Save Note</button>
            {lead.notes?.map((n) => (
              <div key={n.id} className="text-sm border-t pt-2">
                <p>{n.content}</p>
                <p className="text-xs text-subtle">{n.author?.name} &middot; {formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold text-main">Schedule Follow-up</h3>
            <input type="datetime-local" className="input" value={followUp.scheduledAt}
              onChange={(e) => setFollowUp({ ...followUp, scheduledAt: e.target.value })} />
            <textarea className="input" rows={2} placeholder="Remarks" value={followUp.remarks}
              onChange={(e) => setFollowUp({ ...followUp, remarks: e.target.value })} />
            <button className="btn-primary w-full" onClick={handleFollowUp}>Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { LEAD_STATUSES, STATUS_LABELS } from '../../utils/constants';
import LeadPulseBadge from './LeadPulseBadge';

export default function LeadsKanban({ leads }) {
  const columns = LEAD_STATUSES.filter((s) => s !== 'LOST' && s !== 'NOT_INTERESTED');

  return (
    <div className="leads-kanban">
      {columns.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="leads-kanban__col">
            <header className="leads-kanban__head">
              <span>{STATUS_LABELS[status] || status}</span>
              <em>{columnLeads.length}</em>
            </header>
            <div className="leads-kanban__cards">
              {columnLeads.length === 0 ? (
                <p className="leads-kanban__empty">No leads</p>
              ) : (
                columnLeads.map((lead) => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="leads-kanban__card">
                    <div className="leads-kanban__card-top">
                      <strong>{lead.customerName}</strong>
                      <LeadPulseBadge lead={lead} compact />
                    </div>
                    <p className="leads-kanban__phone">{lead.phone}</p>
                    {lead.city && <p className="leads-kanban__meta">{lead.city}</p>}
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

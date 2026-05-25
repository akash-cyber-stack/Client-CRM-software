import { useMemo } from 'react';

/** Workspace limits surfaced like runtime config — updates when plan changes */
const WORKSPACE_LIMITS = {
  STARTER: {
    seats: '5',
    leads: '500',
    ivr: 'off',
    automation: 'basic',
    ai: 'off',
    support: 'email',
  },
  PROFESSIONAL: {
    seats: '25',
    leads: 'unlimited',
    ivr: 'on',
    automation: 'full',
    ai: 'off',
    support: 'priority',
  },
  ENTERPRISE: {
    seats: 'unlimited',
    leads: 'unlimited',
    ivr: 'on',
    automation: 'full',
    ai: 'on',
    support: 'dedicated',
  },
};

const MATRIX_ROWS = [
  { label: 'Seats', key: 'seats' },
  { label: 'Leads', key: 'leads' },
  { label: 'IVR', key: 'ivr' },
  { label: 'Automation', key: 'automation' },
  { label: 'AI layer', key: 'ai' },
];

function cellValue(planId, key) {
  const v = WORKSPACE_LIMITS[planId]?.[key];
  if (v === 'on') return '✓';
  if (v === 'off') return '—';
  return v ?? '—';
}

function ConfigLine({ name, value, highlight }) {
  return (
    <div className={`plan-config-line ${highlight ? 'plan-config-line--flash' : ''}`}>
      <span className="plan-config-key">{name}</span>
      <span className="plan-config-val">{value}</span>
    </div>
  );
}

export default function PlanSelector({ plans, selected, onSelect }) {
  const active = useMemo(
    () => plans.find((p) => p.id === selected) || plans[0],
    [plans, selected]
  );

  if (!plans?.length || !active) return null;

  const limits = WORKSPACE_LIMITS[active.id] || WORKSPACE_LIMITS.STARTER;

  return (
    <section className="plan-workspace" aria-label="Subscription plan">
      <div className="plan-workspace-head">
        <h3 className="plan-workspace-title">Plan</h3>
        <p className="plan-workspace-meta">Monthly · provisioned on payment</p>
      </div>

      <div className="plan-seg" role="tablist" aria-label="Choose plan">
        {plans.map((plan) => {
          const on = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`plan-seg-btn ${on ? 'plan-seg-btn--on' : ''}`}
              onClick={() => onSelect(plan.id)}
            >
              <span className="plan-seg-name">{plan.name}</span>
              <span className="plan-seg-price">{plan.priceLabel}</span>
              {plan.popular && <span className="plan-seg-flag">*</span>}
            </button>
          );
        })}
      </div>

      <div className="plan-config" key={active.id}>
        <div className="plan-config-chrome">
          <span className="plan-config-dots" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="plan-config-file">workspace.config</span>
          <span className="plan-config-status">live</span>
        </div>
        <div className="plan-config-body">
          <ConfigLine name="plan" value={active.id.toLowerCase()} highlight />
          <ConfigLine name="display_name" value={active.name} highlight />
          <ConfigLine name="billing_inr" value={`${active.price} / month`} highlight />
          <ConfigLine name="seat_limit" value={limits.seats} highlight />
          <ConfigLine name="lead_cap" value={limits.leads} highlight />
          <ConfigLine name="ivr_bridge" value={limits.ivr} highlight />
          <ConfigLine name="automation" value={limits.automation} highlight />
          <ConfigLine name="ai_layer" value={limits.ai} highlight />
          <ConfigLine name="support_tier" value={limits.support} highlight />
        </div>
      </div>

      <div className="plan-matrix-wrap">
        <p className="plan-matrix-label">Capability map — tap a column to switch plan</p>
        <table className="plan-matrix">
          <thead>
            <tr>
              <th scope="col" className="plan-matrix-corner" />
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className={selected === plan.id ? 'plan-matrix-col--on' : ''}>
                  <button
                    type="button"
                    className="plan-matrix-col-btn"
                    onClick={() => onSelect(plan.id)}
                  >
                    {plan.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="plan-matrix-row-label">
                  {row.label}
                </th>
                {plans.map((plan) => {
                  const on = selected === plan.id;
                  return (
                    <td
                      key={plan.id}
                      className={on ? 'plan-matrix-cell--on' : ''}
                    >
                      <button
                        type="button"
                        className="plan-matrix-cell-btn"
                        onClick={() => onSelect(plan.id)}
                      >
                        {cellValue(plan.id, row.key)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="plan-workspace-foot">{active.description}</p>
    </section>
  );
}

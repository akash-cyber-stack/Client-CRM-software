export default function PlanSelector({ plans, selected, onSelect }) {
  if (!plans?.length) return null;

  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <button
          key={plan.id}
          type="button"
          className={`plan-card ${selected === plan.id ? 'plan-card--active' : ''} ${plan.popular ? 'plan-card--popular' : ''}`}
          onClick={() => onSelect(plan.id)}
        >
          {plan.popular && <span className="plan-card-badge">Popular</span>}
          <h3 className="plan-card-name">{plan.name}</h3>
          <p className="plan-card-price">
            <span className="plan-card-amount">{plan.priceLabel}</span>
            <span className="plan-card-period">{plan.period}</span>
          </p>
          <p className="plan-card-desc">{plan.description}</p>
          <ul className="plan-card-features">
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

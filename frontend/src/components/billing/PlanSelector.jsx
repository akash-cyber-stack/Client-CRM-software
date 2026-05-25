export default function PlanSelector({ plans, selected, onSelect }) {
  if (!plans?.length) return null;

  return (
    <fieldset className="plan-pick">
      <legend className="plan-pick-legend">Plan</legend>
      <p className="plan-pick-note">
        Monthly billing. You pay once at signup — CRM opens right after payment.
      </p>

      <div className="plan-pick-list" role="radiogroup" aria-label="Subscription plan">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`plan-pick-option ${isSelected ? 'plan-pick-option--on' : ''}`}
              onClick={() => onSelect(plan.id)}
            >
              <span className="plan-pick-radio" aria-hidden="true">
                <span className="plan-pick-radio-dot" />
              </span>

              <span className="plan-pick-body">
                <span className="plan-pick-row">
                  <span className="plan-pick-name">
                    {plan.name}
                    {plan.popular && (
                      <span className="plan-pick-tag">Recommended</span>
                    )}
                  </span>
                  <span className="plan-pick-price">
                    {plan.priceLabel}
                    <span className="plan-pick-period">{plan.period}</span>
                  </span>
                </span>

                <span className="plan-pick-desc">{plan.description}</span>

                {isSelected ? (
                  <ul className="plan-pick-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="plan-pick-summary">
                    {plan.features.slice(0, 3).join(' · ')}
                    {plan.features.length > 3 ? ' · …' : ''}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

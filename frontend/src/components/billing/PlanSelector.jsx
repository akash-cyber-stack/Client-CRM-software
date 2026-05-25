import { useMemo } from 'react';

const TIER_META = {
  STARTER: {
    tier: '01',
    tagline: 'Launch lane',
    icon: '◇',
    accent: 'starter',
    glow: 'rgba(56, 189, 248, 0.35)',
  },
  PROFESSIONAL: {
    tier: '02',
    tagline: 'Velocity lane',
    icon: '⚡',
    accent: 'pro',
    glow: 'rgba(59, 130, 246, 0.45)',
    ribbon: 'Most chosen',
  },
  ENTERPRISE: {
    tier: '03',
    tagline: 'Command lane',
    icon: '✦',
    accent: 'enterprise',
    glow: 'rgba(168, 85, 247, 0.4)',
    ribbon: 'AI suite',
  },
};

function PlanIcon({ accent }) {
  return (
    <span className={`plan-vault-icon plan-vault-icon--${accent}`} aria-hidden="true">
      <span className="plan-vault-icon-ring" />
      <span className="plan-vault-icon-core" />
    </span>
  );
}

export default function PlanSelector({ plans, selected, onSelect }) {
  const active = useMemo(
    () => plans?.find((p) => p.id === selected) || plans?.[0],
    [plans, selected]
  );
  const activeIndex = Math.max(0, plans?.findIndex((p) => p.id === selected) ?? 0);

  if (!plans?.length || !active) return null;

  const meta = TIER_META[active.id] || TIER_META.STARTER;

  return (
    <section className="plan-vault" aria-label="Select subscription plan">
      <header className="plan-vault-header">
        <p className="plan-vault-eyebrow">Workspace package</p>
        <h3 className="plan-vault-title">Choose your growth engine</h3>
        <p className="plan-vault-sub">
          One payment unlocks your entire CRM — pick the lane that matches your team today.
        </p>
      </header>

      <div
        className="plan-vault-tabs"
        role="tablist"
        aria-label="Plan tiers"
        style={{ '--plan-tab-index': activeIndex, '--plan-tab-count': plans.length }}
      >
        <span className="plan-vault-tabs-glider" aria-hidden="true" />
        {plans.map((plan) => {
          const m = TIER_META[plan.id] || TIER_META.STARTER;
          const isActive = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`plan-vault-tab plan-vault-tab--${m.accent} ${isActive ? 'plan-vault-tab--active' : ''}`}
              onClick={() => onSelect(plan.id)}
            >
              {m.ribbon && <span className="plan-vault-tab-ribbon">{m.ribbon}</span>}
              <span className="plan-vault-tab-tier">Tier {m.tier}</span>
              <span className="plan-vault-tab-name">{plan.name}</span>
              <span className="plan-vault-tab-price">
                {plan.priceLabel}
                <small>{plan.period}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={`plan-vault-stage plan-vault-stage--${meta.accent}`}
        role="tabpanel"
        key={active.id}
      >
        <div className="plan-vault-stage-orb" aria-hidden="true" />
        <div className="plan-vault-stage-grid" aria-hidden="true" />

        <div className="plan-vault-stage-top">
          <PlanIcon accent={meta.accent} />
          <div className="plan-vault-stage-copy">
            <div className="plan-vault-stage-label-row">
              <span className="plan-vault-stage-glyph">{meta.icon}</span>
              <span className="plan-vault-stage-tag">{meta.tagline}</span>
            </div>
            <h4 className="plan-vault-stage-name">{active.name}</h4>
            <p className="plan-vault-stage-desc">{active.description}</p>
          </div>
          <div className="plan-vault-stage-price-block">
            <span className="plan-vault-stage-amount">{active.priceLabel}</span>
            <span className="plan-vault-stage-period">{active.period}</span>
            <span className="plan-vault-stage-billed">Billed monthly · Cancel anytime</span>
          </div>
        </div>

        <div className="plan-vault-features">
          <p className="plan-vault-features-title">Everything in this lane</p>
          <ul className="plan-vault-feature-list">
            {active.features.map((feature, i) => (
              <li
                key={feature}
                className="plan-vault-feature"
                style={{ '--feature-delay': `${i * 40}ms` }}
              >
                <span className="plan-vault-feature-check" aria-hidden="true">
                  <svg viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.2L5 8.7L9.5 3.3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="plan-vault-foot">
          <span className="plan-vault-foot-pill">Secure multi-tenant workspace</span>
          <span className="plan-vault-foot-pill">Instant activation after payment</span>
          {active.id === 'ENTERPRISE' && (
            <span className="plan-vault-foot-pill plan-vault-foot-pill--ai">AI Advisor on dashboard</span>
          )}
        </div>
      </div>

      <p className="plan-vault-hint">
        <span className="plan-vault-hint-dot" aria-hidden="true" />
        Tap a tier above to compare — your selection carries through to payment.
      </p>
    </section>
  );
}

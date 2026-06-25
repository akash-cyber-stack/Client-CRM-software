import { Link } from 'react-router-dom';
import { PAGE_SEO } from '../../constants/marketingSeo';
import { MARKETING_PLANS, PRICING_COMPARE, TRIAL_HEADLINE } from '../../constants/marketingContent';
import MarketingLayout, { MarketingPageHero, MarketingCtaBand } from '../../components/marketing/MarketingLayout';

export default function PricingPage() {
  return (
    <MarketingLayout seo={PAGE_SEO.pricing}>
      <MarketingPageHero
        kicker="INR billing"
        title="Start with a 10-day trial. Pay only when the floor is ready."
        subtitle={`${TRIAL_HEADLINE}. All plans bill monthly through Razorpay after trial. Flat workspace pricing, not per-user.`}
      />

      <div className="mkt-pricing-grid">
        {MARKETING_PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`mkt-price-card ${plan.popular ? 'mkt-price-card--popular' : ''}`}
          >
            {plan.popular && <span className="mkt-price-card__badge">Most teams pick this</span>}
            <h2>{plan.name}</h2>
            <p className="mkt-price-card__amount">
              {plan.price}
              <span>{plan.period}</span>
            </p>
            <p className="mkt-price-card__trial">{plan.trialNote}</p>
            <p className="mkt-price-card__best">{plan.bestFor}</p>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link
              to="/login?mode=register"
              className={plan.popular ? 'mkt-btn mkt-btn--gold w-full' : 'mkt-btn mkt-btn--ghost w-full'}
            >
              Start free trial
            </Link>
          </article>
        ))}
      </div>

      <section className="mkt-section">
        <h2 className="mkt-section__title">Side-by-side comparison</h2>
        <div className="mkt-compare-wrap">
          <table className="mkt-compare">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Starter</th>
                <th>Professional</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_COMPARE.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.starter}</td>
                  <td>{row.pro}</td>
                  <td>{row.ent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mkt-section mkt-section--inset">
        <p className="mkt-pricing-note">
          GST invoices and enterprise contracts available on request for Enterprise workspaces.
          Questions? <Link to="/faq">Read the FAQ</Link> or email your ops lead after signup.
        </p>
      </section>

      <MarketingCtaBand
        title="Try any plan free for 10 days"
        text="Register, connect a webhook, and upgrade via Razorpay only when the trial ends."
        primaryLabel="Start free trial"
      />
    </MarketingLayout>
  );
}

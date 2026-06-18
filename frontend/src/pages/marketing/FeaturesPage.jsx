import { Link } from 'react-router-dom';
import { PAGE_SEO } from '../../constants/marketingSeo';
import { MARKETING_FEATURES, FEATURE_CATEGORIES } from '../../constants/marketingContent';
import MarketingLayout, { MarketingPageHero, MarketingCtaBand } from '../../components/marketing/MarketingLayout';

export default function FeaturesPage() {
  return (
    <MarketingLayout seo={PAGE_SEO.features}>
      <MarketingPageHero
        kicker="Product depth"
        title="Features that match how Indian sales floors actually work"
        subtitle="Not a laundry list of checkboxes — each capability solves a specific leak in your lead-to-close flow."
      />

      {FEATURE_CATEGORIES.map((cat) => {
        const items = MARKETING_FEATURES.filter((f) => f.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="mkt-section">
            <h2 className="mkt-section__title">{cat}</h2>
            <div className="mkt-feature-detail-grid">
              {items.map((f) => (
                <article key={f.slug} id={f.slug} className="mkt-feature-detail">
                  <h3>{f.title}</h3>
                  <p className="mkt-feature-detail__lead">{f.desc}</p>
                  <p className="mkt-feature-detail__body">{f.detail}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mkt-section mkt-section--inset">
        <div className="mkt-inline-links">
          <Link to="/modules">See where features live → Modules</Link>
          <Link to="/pricing">Plans that unlock IVR & reports → Pricing</Link>
        </div>
      </section>

      <MarketingCtaBand
        title="Try the desk on your next campaign week"
        text="Register a workspace, connect one webhook, and compare response times yourself."
      />
    </MarketingLayout>
  );
}

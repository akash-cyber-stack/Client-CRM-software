import { Link } from 'react-router-dom';
import { PAGE_SEO } from '../../constants/marketingSeo';
import { MARKETING_MODULES } from '../../constants/marketingContent';
import MarketingLayout, { MarketingPageHero, MarketingCtaBand } from '../../components/marketing/MarketingLayout';

export default function ModulesPage() {
  return (
    <MarketingLayout seo={PAGE_SEO.modules}>
      <MarketingPageHero
        kicker="Architecture"
        title="Seven modules. Zero bolt-on plugins."
        subtitle="Everything shares the same lead record — calls, notes, follow-ups, and reports read from one source of truth."
      />

      <div className="mkt-module-detail-list">
        {MARKETING_MODULES.map((m, i) => (
          <article key={m.id} className="mkt-module-detail" id={m.id}>
            <div className="mkt-module-detail__meta">
              <span className="mkt-module-detail__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="mkt-module-detail__tag">{m.tag}</span>
            </div>
            <div className="mkt-module-detail__body">
              <h2>{m.name}</h2>
              <p className="mkt-module-detail__summary">{m.summary}</p>
              <p className="mkt-module-detail__who">
                <strong>Best for:</strong> {m.forWho}
              </p>
              <ul>
                {m.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <section className="mkt-section mkt-section--inset">
        <div className="mkt-inline-links">
          <Link to="/features">Deep-dive on capabilities → Features</Link>
          <Link to="/faq">Setup questions → FAQ</Link>
        </div>
      </section>

      <MarketingCtaBand
        title="Open the module that matches your role"
        text="Managers start at Command Center. Closers live in Lead Vault and Follow-up Radar."
      />
    </MarketingLayout>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_SEO } from '../../constants/marketingSeo';
import { MARKETING_FAQ } from '../../constants/marketingContent';
import MarketingLayout, { MarketingPageHero, MarketingCtaBand } from '../../components/marketing/MarketingLayout';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: MARKETING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function FaqPage() {
  const [open, setOpen] = useState(0);

  return (
    <MarketingLayout seo={PAGE_SEO.faq} jsonLd={faqJsonLd}>
      <MarketingPageHero
        kicker="Support"
        title="Questions teams ask before switching off spreadsheets"
        subtitle="Setup, billing, webhooks, and day-to-day use — answered in plain language."
      />

      <div className="mkt-faq-list">
        {MARKETING_FAQ.map((item, i) => (
          <article
            key={item.q}
            className={`mkt-faq-item ${open === i ? 'is-open' : ''}`}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} itemProp="name">
              {item.q}
              <span aria-hidden="true">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text">{item.a}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <section className="mkt-section mkt-section--inset">
        <div className="mkt-inline-links">
          <Link to="/features">Feature list →</Link>
          <Link to="/pricing">Plan comparison →</Link>
          <Link to="/login">Login to workspace →</Link>
        </div>
      </section>

      <MarketingCtaBand
        title="Still deciding? Spin up a workspace and test with real leads"
        text="You can connect one Meta or Google webhook and invite two reps before committing the whole floor."
      />
    </MarketingLayout>
  );
}

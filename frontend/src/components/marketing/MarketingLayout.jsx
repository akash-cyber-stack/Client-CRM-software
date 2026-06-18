import { Link } from 'react-router-dom';
import MarketingSEO from './MarketingSEO';
import MarketingNavbar from './MarketingNavbar';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout({ seo, children, jsonLd }) {
  return (
    <div className="mkt-page">
      <div className="mkt-page__bg" aria-hidden="true">
        <div className="mkt-page__grain" />
        <div className="mkt-page__glow mkt-page__glow--a" />
        <div className="mkt-page__glow mkt-page__glow--b" />
      </div>
      <MarketingSEO {...seo} jsonLd={jsonLd} />
      <MarketingNavbar />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function MarketingPageHero({ kicker, title, subtitle, children }) {
  return (
    <header className="mkt-page-hero">
      {kicker && <p className="mkt-kicker">{kicker}</p>}
      <h1>{title}</h1>
      {subtitle && <p className="mkt-page-hero__sub">{subtitle}</p>}
      {children}
    </header>
  );
}

export function MarketingCtaBand({ title, text, primaryLabel = 'Create workspace', primaryTo = '/login?mode=register' }) {
  return (
    <section className="mkt-cta-band">
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="mkt-cta-band__actions">
        <Link className="mkt-btn mkt-btn--gold" to={primaryTo}>
          {primaryLabel}
        </Link>
        <Link className="mkt-btn mkt-btn--ghost" to="/pricing">
          View pricing
        </Link>
      </div>
    </section>
  );
}

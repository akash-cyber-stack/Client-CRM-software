import { Link } from 'react-router-dom';
import { PAGE_SEO, SITE_NAME, SITE_URL } from '../constants/marketingSeo';
import {
  TRIAL_HEADLINE,
  MARKETING_STATS,
  MARKETING_FEATURES,
  MARKETING_MODULES,
  HOME_PROBLEM_POINTS,
  HOME_WORKFLOW,
  HOME_TESTIMONIAL,
  PLAN_EXCLUSIVE_FEATURES,
  WHY_US_COMPARE,
  MOBILE_WEB_POINTS,
} from '../constants/marketingContent';
import MarketingLayout, { MarketingCtaBand } from '../components/marketing/MarketingLayout';

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: '10-day free trial',
    url: `${SITE_URL}/login?mode=register`,
  },
  description: PAGE_SEO.home.description,
  url: SITE_URL,
};

export default function Landing() {
  return (
    <MarketingLayout seo={PAGE_SEO.home} jsonLd={homeJsonLd}>
      <section className="mkt-home-hero">
        <div className="mkt-home-hero__copy">
          <p className="mkt-trial-pill">{TRIAL_HEADLINE}</p>
          <p className="mkt-kicker">Ad leads - assigned rep - logged call - closed deal</p>
          <h1>
            A premium sales command desk for <em>Google &amp; Meta</em> lead teams.
          </h1>
          <p className="mkt-home-hero__lead">
            Sales Lead CRM turns ad enquiries into a clean operating system: one lead vault, smart
            routing, IVR call timelines, follow-up discipline, and manager-grade reports. Your team
            gets a polished workspace with <strong>flat workspace pricing</strong>{' '}
            and a full <strong>10-day trial</strong> before you pay.
          </p>
          <div className="mkt-home-hero__actions">
            <Link to="/login?mode=register" className="mkt-btn mkt-btn--gold">
              Start free trial
            </Link>
            <Link to="/pricing" className="mkt-btn mkt-btn--ghost">
              See plans
            </Link>
          </div>
          <dl className="mkt-home-stats">
            {MARKETING_STATS.map((s) => (
              <div key={s.label}>
                <dt>{s.value}</dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mkt-home-mock" aria-hidden="true">
          <div className="mkt-mock-window">
            <div className="mkt-mock-window__chrome">
              <span />
              <span />
              <span />
              <em>Lead Vault - today</em>
            </div>
            <div className="mkt-mock-rows">
              <div className="mkt-mock-row mkt-mock-row--hot">
                <span className="mkt-mock-pulse">92</span>
                <div>
                  <strong>Rahul S. - Meta - Home loan</strong>
                  <small>Assigned - Follow-up in 2h</small>
                </div>
              </div>
              <div className="mkt-mock-row">
                <span className="mkt-mock-pulse mkt-mock-pulse--warm">71</span>
                <div>
                  <strong>Priya K. - Google Ads</strong>
                  <small>New - Round-robin queued</small>
                </div>
              </div>
              <div className="mkt-mock-row">
                <span className="mkt-mock-pulse mkt-mock-pulse--cold">44</span>
                <div>
                  <strong>IVR call logged - 4m 12s</strong>
                  <small>Recording on lead timeline</small>
                </div>
              </div>
            </div>
            <div className="mkt-mock-footer">
              <span>Trial day 3 of 10</span>
              <span>8 follow-ups due</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-plan-showcase">
        <div className="mkt-section__head">
          <p className="mkt-kicker">Plans unlock different powers</p>
          <h2>Pick Starter to trial. Unlock IVR and reports on Professional.</h2>
          <p className="mkt-section__sub">
            Each plan is built for a real stage of your sales operation. Your trial starts on the plan
            you choose at signup.
          </p>
        </div>
        <div className="mkt-plan-showcase__grid">
          {PLAN_EXCLUSIVE_FEATURES.map((plan) => (
            <article
              key={plan.id}
              className={`mkt-plan-card ${plan.popular ? 'mkt-plan-card--popular' : ''}`}
            >
              {plan.popular && <span className="mkt-plan-card__badge">Most picked</span>}
              <span className="mkt-plan-card__tag">{plan.tag}</span>
              <h3>{plan.name}</h3>
              <p className="mkt-plan-card__price">{plan.price}</p>
              <p className="mkt-plan-card__headline">{plan.headline}</p>
              <ul>
                {plan.exclusives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link to={`/login?mode=register&plan=${plan.id}`} className="mkt-btn mkt-btn--ghost mkt-btn--sm">
                Trial {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-section mkt-problem">
        <div className="mkt-section__head mkt-section__head--left">
          <p className="mkt-kicker">Sound familiar?</p>
          <h2>Most teams lose deals in the handoff, not the pitch.</h2>
        </div>
        <ul className="mkt-problem-list">
          {HOME_PROBLEM_POINTS.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mkt-section mkt-section--inset mkt-versus">
        <div className="mkt-section__head">
          <p className="mkt-kicker">Why teams switch</p>
          <h2>Spreadsheets vs basic dialer CRM vs Sales Lead CRM</h2>
          <p className="mkt-section__sub">
            A clearer comparison for teams that want campaign leads, calls, follow-ups, and reports
            in one premium workspace.
          </p>
        </div>
        <div className="mkt-compare-wrap">
          <table className="mkt-compare mkt-compare--versus">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Sales Lead CRM</th>
                <th>Spreadsheet</th>
                <th>SIM dialer CRM</th>
              </tr>
            </thead>
            <tbody>
              {WHY_US_COMPARE.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="mkt-compare__us">{row.us}</td>
                  <td>{row.sheets}</td>
                  <td>{row.dialer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <p className="mkt-kicker">How teams use it</p>
          <h2>From ad click to closed deal without tab hopping</h2>
        </div>
        <ol className="mkt-workflow">
          {HOME_WORKFLOW.map((step, i) => (
            <li key={step.title}>
              <span className="mkt-workflow__n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mkt-section__link">
          <Link to="/modules">Explore all seven modules -</Link>
        </p>
      </section>

      <section className="mkt-section mkt-mobile-strip">
        <div className="mkt-mobile-strip__inner">
          <div className="mkt-mobile-strip__copy">
            <p className="mkt-kicker">On the move</p>
            <h2>Mobile-ready web desk. Play Store app coming.</h2>
            <p>
              Reps already use Sales Lead CRM from phone browsers on the floor. A native Android app is
              on our roadmap; until then you get the full responsive desk without a separate install.
            </p>
            <ul>
              {MOBILE_WEB_POINTS.map((point) => (
                <li key={point.title}>
                  <strong>{point.title}</strong>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mkt-mobile-strip__device" aria-hidden="true">
            <div className="mkt-phone-frame">
              <div className="mkt-phone-frame__screen">
                <small>Follow-up Radar</small>
                <strong>3 due today</strong>
                <div className="mkt-phone-frame__row mkt-phone-frame__row--urgent">Overdue - Meta lead</div>
                <div className="mkt-phone-frame__row">Due 4pm - Google Ads</div>
                <div className="mkt-phone-frame__row">Pending - Callback</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--inset">
        <div className="mkt-section__head">
          <p className="mkt-kicker">Highlights</p>
          <h2>Features your reps will actually open every morning</h2>
        </div>
        <div className="mkt-feature-teaser">
          {MARKETING_FEATURES.slice(0, 6).map((f) => (
            <article key={f.slug}>
              <span className="mkt-feature-teaser__cat">{f.category}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
        <p className="mkt-section__link mkt-section__link--center">
          <Link to="/features" className="mkt-btn mkt-btn--ghost">
            All 12 features
          </Link>
        </p>
      </section>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <p className="mkt-kicker">Modules</p>
          <h2>Seven rooms. One login.</h2>
        </div>
        <div className="mkt-module-teaser">
          {MARKETING_MODULES.map((m) => (
            <Link key={m.id} to="/modules" className="mkt-module-teaser__card">
              <span>{m.tag}</span>
              <strong>{m.name}</strong>
              <p>{m.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mkt-quote">
        <blockquote>
          <p>&ldquo;{HOME_TESTIMONIAL.quote}&rdquo;</p>
          <footer>
            - {HOME_TESTIMONIAL.name}, {HOME_TESTIMONIAL.role}
          </footer>
        </blockquote>
      </section>

      <section className="mkt-section mkt-pricing-teaser">
        <div className="mkt-pricing-teaser__inner">
          <div>
            <p className="mkt-kicker">Pricing</p>
            <h2>{TRIAL_HEADLINE}</h2>
            <p>
              Flat workspace billing from Rs 1,299/mo, not per-rep pricing. Upgrade when IVR and reports
              matter.
            </p>
          </div>
          <Link to="/login?mode=register" className="mkt-btn mkt-btn--gold">
            Start free trial
          </Link>
        </div>
      </section>

      <MarketingCtaBand
        title="Try the full desk free for 10 days"
        text="Create a workspace, connect your webhooks, and see if your floor keeps it open. No card required."
        primaryLabel="Start free trial"
        primaryTo="/login?mode=register"
      />
    </MarketingLayout>
  );
}

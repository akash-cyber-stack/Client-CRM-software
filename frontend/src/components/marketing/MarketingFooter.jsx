import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer__grid">
        <div className="mkt-footer__brand">
          <BrandLogo size="sm" />
          <p>
            Lead intake, IVR calls, and follow-ups in one workspace — built for teams running Google
            Ads and Meta campaigns in India.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <Link to="/features">Features</Link>
          <Link to="/modules">Modules</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div>
          <h4>Workspace</h4>
          <Link to="/login">Login</Link>
          <Link to="/login?mode=register">Create account</Link>
        </div>
        <div>
          <h4>Built for</h4>
          <p className="mkt-footer__muted">Agencies · Real estate · Ed-tech · Local services · B2B inside sales</p>
        </div>
      </div>
      <div className="mkt-footer__bar">
        <p>© {new Date().getFullYear()} Sales Lead CRM</p>
        <p className="mkt-footer__muted">GST-ready workspaces · Razorpay billing · Email OTP sign-in</p>
      </div>
    </footer>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, billingApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import AuthMarketingPanel from '../components/auth/AuthMarketingPanel';
import AuthLogo from '../components/auth/AuthLogo';
import AuthFlowTabs from '../components/auth/AuthFlowTabs';
import OAuthButtons from '../components/auth/OAuthButtons';
import PlanSelector from '../components/billing/PlanSelector';
import PaymentStep from '../components/billing/PaymentStep';
import { IconEye, IconEyeOff } from '../components/auth/AuthIcons';

const REMEMBER_KEY = 'crm-remember-email';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('SALES_EMPLOYEE');
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL');
  const [plans, setPlans] = useState([]);
  const [setup, setSetup] = useState({ canRegisterSuperAdmin: true });
  const [paymentSession, setPaymentSession] = useState(null);
  const [remember, setRemember] = useState(!!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState([]);

  const { login, register, setSessionFromToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const oauthErr = searchParams.get('oauth_error');
    if (oauthErr) setError(decodeURIComponent(oauthErr));
  }, [searchParams]);

  useEffect(() => {
    authApi.setupStatus().then((res) => setSetup(res.data.data)).catch(() => {});
    authApi.oauthProviders().then((res) => setOauthProviders(res.data.data || [])).catch(() => {});
    billingApi.plans().then((res) => setPlans(res.data.data || [])).catch(() => {});
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      await login({ email, password });
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'PAYMENT_REQUIRED' && data?.data?.paymentToken) {
        setPaymentSession({
          paymentToken: data.data.paymentToken,
          planDetails: data.data.planDetails,
        });
        setError('');
      } else {
        setError(data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role: setup.canRegisterSuperAdmin ? undefined : role,
        companyName: setup.canRegisterSuperAdmin ? companyName : undefined,
        plan: setup.canRegisterSuperAdmin ? selectedPlan : undefined,
      };
      const res = await authApi.register(payload);
      const data = res.data.data;

      if (data.needsPayment) {
        setPaymentSession({
          paymentToken: data.paymentToken,
          planDetails: data.planDetails,
        });
        return;
      }

      localStorage.setItem('token', data.token);
      await setSessionFromToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (token) => {
    if (token) {
      await setSessionFromToken(token);
      navigate('/');
    } else {
      setMode('signin');
      setPaymentSession(null);
      setError('');
    }
  };

  if (paymentSession) {
    return (
      <div className="auth-page min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
        <section className="auth-form-panel flex-1 flex flex-col">
          <header className="auth-form-header">
            <AuthLogo size="lg" />
            <ThemeToggle />
          </header>
          <div className="auth-form-body flex-1 flex items-center justify-center px-4 py-8">
            <div className="auth-form-card w-full max-w-[480px]">
              <PaymentStep
                paymentToken={paymentSession.paymentToken}
                planDetails={paymentSession.planDetails}
                onSuccess={onPaymentSuccess}
                onError={setError}
              />
              {error && <div className="auth-form-error mt-4">{error}</div>}
            </div>
          </div>
        </section>
        <AuthMarketingPanel onGetStarted={() => setMode('register')} />
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      <section className="auth-form-panel flex-1 flex flex-col">
        <header className="auth-form-header">
          <div className="auth-form-brand">
            <AuthLogo size="lg" />
            <div className="auth-form-brand-text">
              <p className="auth-form-brand-name">Sales Lead CRM</p>
              <p className="auth-form-brand-tag">Choose a plan · Pay · Start selling</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="auth-form-body flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 py-6 pb-10">
          <div className="auth-form-card w-full max-w-[520px]">
            <AuthFlowTabs mode={mode} onChange={(m) => { setMode(m); setError(''); }} />

            <h1 className="auth-form-title mt-6">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-form-subtitle">
              {mode === 'signin'
                ? 'Sign in with your email and password.'
                : setup.canRegisterSuperAdmin
                  ? 'Pick a plan, register, pay — then use the CRM.'
                  : 'Join your team workspace.'}
            </p>

            {error && (
              <div className="auth-form-error mt-5" role="alert">
                {error}
              </div>
            )}

            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="auth-form-fields mt-6">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input auth-input-padded"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-input-action"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember email</span>
                </label>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <OAuthButtons providers={oauthProviders} disabled={loading} />
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="auth-form-fields auth-form-fields-tight mt-6">
                {setup.canRegisterSuperAdmin && (
                  <>
                    <div className="auth-field">
                      <label className="auth-label">Company / workspace name</label>
                      <input
                        className="auth-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        placeholder="Your business name"
                      />
                    </div>
                    <div>
                      <label className="auth-label block mb-2">Select a plan</label>
                      <PlanSelector plans={plans} selected={selectedPlan} onSelect={setSelectedPlan} />
                    </div>
                  </>
                )}
                {!setup.canRegisterSuperAdmin && setup.hasSuperAdmin && (
                  <div className="auth-form-notice">Join your existing team workspace.</div>
                )}
                <div className="auth-field">
                  <label className="auth-label">Full name</label>
                  <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Phone (optional)</label>
                  <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                {!setup.canRegisterSuperAdmin && (
                  <div className="auth-field">
                    <label className="auth-label">Role</label>
                    <select className="auth-input auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="SALES_EMPLOYEE">Sales Employee</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating…' : setup.canRegisterSuperAdmin ? 'Register & continue to payment' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <AuthMarketingPanel onGetStarted={() => setMode('register')} />
    </div>
  );
}

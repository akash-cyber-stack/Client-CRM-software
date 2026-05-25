import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, billingApi } from '../api';
import AuthMarketingPanel from '../components/auth/AuthMarketingPanel';
import AuthFormPanel from '../components/auth/AuthFormPanel';
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
  const [workspaceMode, setWorkspaceMode] = useState('create');
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
      await login({ email, password, companyName });
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
      const isCreatingWorkspace = setup.canRegisterSuperAdmin || workspaceMode === 'create';
      const payload = {
        name,
        email,
        phone,
        password,
        role: isCreatingWorkspace ? undefined : role,
        companyName: companyName || undefined,
        plan: isCreatingWorkspace ? selectedPlan : undefined,
        createWorkspace: isCreatingWorkspace,
      };
      const res = await authApi.register(payload);
      const data = res.data.data;

      if (data?.needsPayment) {
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
      const data = err.response?.data;
      if (data?.code === 'PAYMENT_REQUIRED' && data?.data?.paymentToken) {
        setPaymentSession({
          paymentToken: data.data.paymentToken,
          planDetails: data.data.planDetails,
        });
        setError('');
        return;
      }
      setError(data?.message || 'Registration failed');
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
        <AuthFormPanel showBrandText={false}>
          <div className="auth-form-card">
            <p className="auth-form-kicker">Checkout</p>
            <h1 className="auth-form-title">Complete your plan</h1>
            <p className="auth-form-subtitle">One step to unlock your workspace.</p>
            <PaymentStep
              paymentToken={paymentSession.paymentToken}
              planDetails={paymentSession.planDetails}
              onSuccess={onPaymentSuccess}
              onError={setError}
            />
            {error && <div className="auth-form-error mt-4">{error}</div>}
          </div>
        </AuthFormPanel>
        <AuthMarketingPanel onGetStarted={() => setMode('register')} />
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      <AuthFormPanel>
        <div className="auth-form-card">
            <AuthFlowTabs mode={mode} onChange={(m) => { setMode(m); setError(''); }} />

            <p className="auth-form-kicker mt-6">
              {mode === 'signin' ? 'Workspace access' : 'New workspace'}
            </p>
            <h1 className="auth-form-title">
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
                  <label className="auth-label" htmlFor="companyName">Workspace name</label>
                  <input
                    id="companyName"
                    className="auth-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Optional if you have one workspace"
                    autoComplete="organization"
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
                {!setup.canRegisterSuperAdmin && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      className={`auth-submit ${workspaceMode === 'create' ? '' : 'opacity-70'}`}
                      onClick={() => setWorkspaceMode('create')}
                    >
                      Create new workspace
                    </button>
                    <button
                      type="button"
                      className={`auth-submit ${workspaceMode === 'join' ? '' : 'opacity-70'}`}
                      onClick={() => setWorkspaceMode('join')}
                    >
                      Join existing workspace
                    </button>
                  </div>
                )}

                <div className="auth-field">
                  <label className="auth-label">Company / workspace name</label>
                  <input
                    className="auth-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder={setup.canRegisterSuperAdmin ? 'Your business name' : 'Enter the workspace name'}
                  />
                </div>

                {(setup.canRegisterSuperAdmin || workspaceMode === 'create') && (
                  <PlanSelector plans={plans} selected={selectedPlan} onSelect={setSelectedPlan} />
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
                {workspaceMode === 'join' && !setup.canRegisterSuperAdmin && (
                  <div className="auth-field">
                    <label className="auth-label">Role</label>
                    <select className="auth-input auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="SALES_EMPLOYEE">Sales Employee</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating…' : setup.canRegisterSuperAdmin || workspaceMode === 'create' ? 'Register & continue to payment' : 'Create account'}
                </button>
              </form>
            )}
        </div>
      </AuthFormPanel>

      <AuthMarketingPanel onGetStarted={() => setMode('register')} />
    </div>
  );
}

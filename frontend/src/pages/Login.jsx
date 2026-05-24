import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import AuthMarketingPanel from '../components/auth/AuthMarketingPanel';
import AuthModeSwitch from '../components/auth/AuthModeSwitch';
import AuthLogo from '../components/auth/AuthLogo';
import { IconEye, IconEyeOff } from '../components/auth/AuthIcons';

const REMEMBER_KEY = 'crm-remember-email';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SALES_EMPLOYEE');
  const [remember, setRemember] = useState(!!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState({ hasSuperAdmin: false, canRegisterSuperAdmin: true });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authApi
      .setupStatus()
      .then((res) => {
        const data = res.data.data;
        setSetup(data);
        if (!data.hasSuperAdmin) setRole('SUPER_ADMIN');
      })
      .catch(() => {});
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Check your connection or try again shortly.');
      } else {
        const msg = err.response?.data?.message;
        setError(msg || (err.response?.status === 500 ? 'Server error — contact your admin' : 'Invalid email or password'));
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
      if (role === 'SUPER_ADMIN' && setup.hasSuperAdmin) {
        setError('Super Admin already exists. Only one Super Admin is allowed.');
        setLoading(false);
        return;
      }
      await register({ name, email, phone, password, role });
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Check your connection or try again shortly.');
      } else {
        const msg = err.response?.data?.message;
        setError(msg || 'Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      <section className="auth-form-panel flex-1 flex flex-col">
        <header className="auth-form-header">
          <div className="auth-form-brand">
            <AuthLogo size="lg" />
            <div className="auth-form-brand-text">
              <p className="auth-form-brand-name">Sales Lead CRM</p>
              <p className="auth-form-brand-tag">Lead &amp; call management</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="auth-form-body flex-1 flex items-center justify-center px-5 sm:px-10 py-8">
          <div className="auth-form-card w-full max-w-[400px]">
            <AuthModeSwitch mode={mode} onChange={switchMode} />

            <h1 className="auth-form-title">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-form-subtitle">
              {mode === 'signin'
                ? 'Enter your credentials to open your workspace.'
                : 'Set up access for your team in under a minute.'}
            </p>

            {error && (
              <div className="auth-form-error" role="alert">
                {error}
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="auth-form-fields">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">
                    Password
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input auth-input-padded"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Your password"
                    />
                    <button
                      type="button"
                      className="auth-input-action"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Remember this device</span>
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Continue to workspace'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="auth-form-fields auth-form-fields-tight">
                {!setup.hasSuperAdmin && (
                  <div className="auth-form-notice">
                    First signup becomes <strong>Super Admin</strong> (one-time).
                  </div>
                )}
                <div className="auth-field">
                  <label className="auth-label">Full name</label>
                  <input
                    className="auth-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Phone</label>
                  <input
                    className="auth-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                  />
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
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Role</label>
                  <select className="auth-input auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="SALES_EMPLOYEE">Sales Employee</option>
                    <option value="MANAGER">Manager</option>
                    {!setup.hasSuperAdmin && <option value="SUPER_ADMIN">Super Admin (setup)</option>}
                  </select>
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create workspace'}
                </button>
              </form>
            )}

            <p className="auth-form-switch">
              {mode === 'signin' ? (
                <>
                  No account yet?{' '}
                  <button type="button" className="auth-text-link" onClick={() => switchMode('register')}>
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button type="button" className="auth-text-link" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="auth-form-legal">
          Authorized business use only. By continuing you accept your organization&apos;s policies.
        </p>
      </section>

      <AuthMarketingPanel onGetStarted={() => switchMode('register')} />

      <div className="lg:hidden auth-mobile-banner">
        <p className="auth-mobile-banner-title">Sales Lead CRM</p>
        <p className="auth-mobile-banner-text">Leads, calls & follow-ups in one workspace.</p>
      </div>
    </div>
  );
}

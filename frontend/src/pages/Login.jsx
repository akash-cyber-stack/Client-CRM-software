import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import AuthMarketingPanel from '../components/auth/AuthMarketingPanel';

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
    <div className="auth-split min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Left — sign in / register */}
      <div className="auth-panel flex-1 flex flex-col">
        <div className="auth-panel-top">
          <div className="flex items-center gap-3">
            <div className="auth-logo">SL</div>
            <div>
              <p className="font-bold text-main text-lg leading-tight">Sales Lead CRM</p>
              <p className="text-xs text-muted">Lead & call management</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="auth-panel-center flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="auth-form-wrap w-full max-w-[420px]">
            <h1 className="auth-form-title">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-form-subtitle">
              {mode === 'signin'
                ? 'Sign in to manage leads, calls, and your team.'
                : 'Join your workspace in under a minute.'}
            </p>

            {error && <div className="alert-error mt-5">{error}</div>}

            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div>
                  <label className="auth-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="input auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input auth-input pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2 text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-default"
                    />
                    Remember me
                  </label>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-base font-semibold" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-3">
                {!setup.hasSuperAdmin && (
                  <div className="alert-warn">
                    First user can register as <strong>Super Admin</strong> (one-time only).
                  </div>
                )}
                <div>
                  <label className="auth-label">Full name</label>
                  <input className="input auth-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                </div>
                <div>
                  <label className="auth-label">Email</label>
                  <input type="email" className="input auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
                </div>
                <div>
                  <label className="auth-label">Phone</label>
                  <input className="input auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="auth-label">Password</label>
                  <input type="password" className="input auth-input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="auth-label">Role</label>
                  <select className="input auth-input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="SALES_EMPLOYEE">Sales Employee</option>
                    <option value="MANAGER">Manager</option>
                    {!setup.hasSuperAdmin && <option value="SUPER_ADMIN">Super Admin (setup)</option>}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full py-3 text-base font-semibold mt-2" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}

            <div className="auth-panel-footer mt-8 pt-6 border-t border-default text-center text-sm text-muted">
              {mode === 'signin' ? (
                <>
                  New to Sales Lead CRM?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('register')}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="auth-legal text-center text-xs text-subtle pb-6 px-4">
          By continuing, you agree to use this CRM only for authorized business purposes.
        </p>
      </div>

      {/* Right — marketing (desktop) */}
      <AuthMarketingPanel onGetStarted={() => switchMode('register')} />

      {/* Mobile marketing strip */}
      <div className="lg:hidden auth-marketing-mobile px-6 py-8 text-center">
        <p className="text-white font-semibold text-lg mb-2">Grow faster with Sales Lead CRM</p>
        <p className="text-slate-300 text-sm mb-4">Leads, calls, follow-ups & team performance — one dashboard.</p>
        {mode === 'signin' && (
          <button type="button" className="auth-cta-btn mx-auto" onClick={() => switchMode('register')}>
            Create free account
          </button>
        )}
      </div>
    </div>
  );
}

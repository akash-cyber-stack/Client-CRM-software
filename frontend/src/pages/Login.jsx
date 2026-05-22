import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
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

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Server not reachable. Wait 2 min after Vercel deploy, then Ctrl+Shift+R.');
      } else {
        const msg = err.response?.data?.message;
        setError(msg || (err.response?.status === 500 ? 'Server error — check Vercel env vars & redeploy' : 'Login failed'));
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
        setError('Server not reachable. Check Vercel deploy logs & DATABASE_URL (Neon pooled).');
      } else {
        const msg = err.response?.data?.message;
        setError(msg || (err.response?.status === 500 ? 'Server error — check Vercel env vars & redeploy' : 'Registration failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-auth)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl dark:opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="auth-card w-full max-w-md relative z-10 mx-2 sm:mx-0">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-glow mb-4">
            SL
          </div>
          <h1 className="text-2xl font-bold text-main">Sales Lead CRM</h1>
          <p className="text-muted mt-2">
            {tab === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(''); }}
            className={`auth-tab ${tab === 'signin' ? 'auth-tab-active' : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`auth-tab ${tab === 'register' ? 'auth-tab-active' : ''}`}
          >
            Register
          </button>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-main mb-2">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {!setup.hasSuperAdmin && (
              <div className="alert-warn">
                No Super Admin yet. Register once as <strong>Super Admin</strong> (only one allowed).
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-main mb-2">Full Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Phone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-2">Role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="SALES_EMPLOYEE">Sales Employee</option>
                <option value="MANAGER">Manager</option>
                {!setup.hasSuperAdmin && <option value="SUPER_ADMIN">Super Admin (one-time)</option>}
              </select>
              {setup.hasSuperAdmin && (
                <p className="text-xs text-muted mt-2">Super Admin already exists.</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}

        <p className="text-xs text-muted mt-8 text-center">
          {tab === 'signin' ? (
            <>New user?{' '}
              <button type="button" className="text-primary-500 font-semibold hover:underline" onClick={() => setTab('register')}>
                Register here
              </button>
            </>
          ) : (
            <>Have an account?{' '}
              <button type="button" className="text-primary-500 font-semibold hover:underline" onClick={() => setTab('signin')}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

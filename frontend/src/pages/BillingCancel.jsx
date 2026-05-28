import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BillingCancel() {
  const { user } = useAuth();

  return (
    <div className="auth-page min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-8">
      <div className="auth-form-card max-w-md w-full">
        <p className="auth-form-kicker">Payment canceled</p>
        <h1 className="auth-form-title">Checkout canceled</h1>
        <p className="auth-form-subtitle">You can retry payment whenever you are ready.</p>
        <div className="mt-8 space-y-3">
          {user ? (
            <Link to="/settings" className="btn-primary w-full text-center">
              Return to billing settings
            </Link>
          ) : (
            <Link to="/login" className="btn-primary w-full text-center">
              Return to login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

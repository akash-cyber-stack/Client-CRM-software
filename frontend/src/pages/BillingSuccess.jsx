import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');

  const message = useMemo(() => {
    if (user) {
      return 'Your payment was successful. Your subscription will activate shortly.';
    }
    return 'Your payment was successful. Return to login to access your workspace once the payment is processed.';
  }, [user]);

  return (
    <div className="auth-page min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-8">
      <div className="auth-form-card max-w-md w-full">
        <p className="auth-form-kicker">Payment complete</p>
        <h1 className="auth-form-title">Thank you!</h1>
        <p className="auth-form-subtitle">{message}</p>
        {sessionId && (
          <p className="text-sm text-muted mt-4">Session ID: <span className="font-mono break-all">{sessionId}</span></p>
        )}
        <div className="mt-8 space-y-3">
          {user ? (
            <Link to="/" className="btn-primary w-full text-center">
              Go back to CRM
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

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromToken } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login?oauth_error=missing_token', { replace: true });
      return;
    }
    setSessionFromToken(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login?oauth_error=session_failed', { replace: true }));
  }, [params, navigate, setSessionFromToken]);

  return <LoadingSpinner className="min-h-screen" />;
}

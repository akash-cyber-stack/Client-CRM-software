import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div className="min-h-screen bg-app"><LoadingSpinner className="min-h-screen" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}

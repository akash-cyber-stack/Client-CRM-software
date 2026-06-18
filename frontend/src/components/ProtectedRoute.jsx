import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessFeature } from '../utils/planAccess';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, adminOnly, requiredFeature }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div className="min-h-screen bg-app"><LoadingSpinner className="min-h-screen" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requiredFeature && !canAccessFeature(user?.plan, requiredFeature)) return <Navigate to="/dashboard" replace />;

  return children;
}

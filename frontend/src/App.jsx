import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Employees from './pages/Employees';
import EmployeePerformance from './pages/EmployeePerformance';
import CallHistory from './pages/CallHistory';
import FollowUps from './pages/FollowUps';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<ProtectedRoute requiredFeature="leads"><Leads /></ProtectedRoute>} />
        <Route path="leads/:id" element={<ProtectedRoute requiredFeature="leads"><LeadDetail /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute adminOnly requiredFeature="employees"><Employees /></ProtectedRoute>} />
        <Route path="employees/:id/performance" element={<ProtectedRoute adminOnly requiredFeature="employees"><EmployeePerformance /></ProtectedRoute>} />
        <Route path="calls" element={<ProtectedRoute adminOnly requiredFeature="calls"><CallHistory /></ProtectedRoute>} />
        <Route path="follow-ups" element={<ProtectedRoute requiredFeature="follow-ups"><FollowUps /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly requiredFeature="reports"><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute adminOnly requiredFeature="settings"><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

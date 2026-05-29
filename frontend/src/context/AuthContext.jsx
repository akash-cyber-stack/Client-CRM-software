import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = (token, u) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const setSessionFromToken = useCallback(async (token) => {
    localStorage.setItem('token', token);
    const res = await authApi.me();
    return setSession(token, res.data.data);
  }, []);

  const login = async ({ email, password, companyName, emailVerifyToken }) => {
    const res = await authApi.login({
      email,
      password,
      companyName: companyName || undefined,
      emailVerifyToken,
    });
    const { token, user: u } = res.data.data;
    return setSession(token, u);
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    if (res.data.data.needsPayment) {
      return res.data.data;
    }
    const { token, user: u } = res.data.data;
    return setSession(token, u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isSalesEmployee = user?.role === 'SALES_EMPLOYEE';
  const hasActiveSubscription = user?.subscriptionStatus === 'ACTIVE';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        setSessionFromToken,
        logout,
        isAdmin,
        isSuperAdmin,
        isSalesEmployee,
        hasActiveSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

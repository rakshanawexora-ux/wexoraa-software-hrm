import { useState, useEffect } from 'react';
import API from '../api/axios';

import { AuthContext } from './auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const controller = new AbortController();
    if (localStorage.getItem('token')) {
      API.get('/auth/me', { signal: controller.signal })
        .then(({ data }) => setUser({ ...data, id: data._id }))
        .catch((error) => {
          if (!controller.signal.aborted && error.response?.status === 401) {
            localStorage.removeItem('token');
            setToken(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }
    return () => controller.abort();
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


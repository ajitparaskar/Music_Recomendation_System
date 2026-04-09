import React, { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './authContext.js';
import { apiRequest } from '../api/client';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await apiRequest('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.user) {
        updateUser(data.user);
      }
      return data.user || null;
    } catch (error) {
      console.error('Failed to refresh profile', error);
      if (error.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshProfile, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

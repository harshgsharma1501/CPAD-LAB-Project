import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setApiToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setApiToken(null);
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (err) {
      console.error('Error during logout storage removal:', err);
    }
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Validate existing stored token on app launch
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
          setApiToken(null);
          setLoading(false);
          return;
        }

        setApiToken(storedToken);

        // Validate token with backend GET /api/auth/me
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data && response.data.id) {
          setToken(storedToken);
          setUser(response.data);
        } else {
          // Invalid or corrupted response
          setApiToken(null);
          await AsyncStorage.multiRemove(['token', 'user']);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Token expired or invalid
        console.log('Stored token invalid or expired on launch:', err.response?.data?.error || err.message);
        setApiToken(null);
        try {
          await AsyncStorage.multiRemove(['token', 'user']);
        } catch (_) {}
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    setApiToken(receivedToken);
    await AsyncStorage.setItem('token', receivedToken);
    await AsyncStorage.setItem('user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

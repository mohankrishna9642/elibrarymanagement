import React, { createContext, useState, useEffect, useContext } from 'react';
import { publicApi, authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      verifyTokenAndFetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyTokenAndFetchProfile = async () => {
    setLoading(true);
    try {
      const response = await authApi.get('/users/profile');
      const userData = response.data;
      setCurrentUser(userData);
      setIsLoggedIn(true);
      setIsAdmin(userData.roles && userData.roles.includes('ROLE_ADMIN'));
    } catch (error) {
      console.error('JWT verification failed during auto-login. Clearing token.', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await publicApi.post('/auth/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('jwtToken', token);

      await verifyTokenAndFetchProfile();
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const authContextValue = {
    currentUser,
    isLoggedIn,
    isAdmin,
    loading,
    login,
    logout,
    refreshUserData: verifyTokenAndFetchProfile
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
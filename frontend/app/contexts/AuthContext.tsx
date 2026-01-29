'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, AuthResponse, RegisterData } from '../services/api';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (username: string, password: string) => Promise<AuthResponse['user']>;
  register: (data: RegisterData) => Promise<AuthResponse['user']>;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<AuthResponse['user']>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: AuthResponse['user']) => void;
  switchRole: () => Promise<AuthResponse['user']>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const tokenRef = useRef<string | null>(null);

  // Sync tokenRef with token state
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Function to clear auth state and redirect to login
  const clearAuthAndRedirect = useCallback((message?: string) => {
    // 1. Clear internal states immediately
    setToken(null);
    setUser(null);
    tokenRef.current = null;

    // 2. Clear ALL potential auth-related indicators in storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_type');
      localStorage.removeItem('auth_timestamp');

      // Clear any session-specific flags
      sessionStorage.clear();
    }

    if (message) {
      toast.error(`Session Expired: ${message}`);
    }

    // 3. Final Fail-safe: Force a total browser reload to clear React memory
    // and all component-level states (like Navbars/Sidebars)
    if (typeof window !== 'undefined') {
      // Redirect happens after reload via the dashbord layouts
      window.location.href = '/auth/login';
    }
  }, []); // Remove router dependency to avoid re-renders during cleanup

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      if (tokenRef.current) {
        setToken(null);
        setUser(null);
        tokenRef.current = null;
      }
      return false;
    }

    try {
      const parts = storedToken.split('.');
      if (parts.length !== 3) throw new Error('Invalid format');

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        clearAuthAndRedirect('Your session has expired. Please log in again.');
        return false;
      }
      return true;
    } catch (error) {
      clearAuthAndRedirect();
      return false;
    }
  }, [clearAuthAndRedirect]);

  // Check auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      tokenRef.current = storedToken;
      const isOk = checkTokenExpiration();
      if (isOk) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }

    setIsLoading(false);

    // Set up API interceptor for 401 responses
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      if (response.status === 401) {
        clearAuthAndRedirect('Your session has expired. Please log in again.');
      }
      return response;
    };

    // Check token expiration every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (!e.newValue) {
          // Token removed in another tab (logout)
          setToken(null);
          setUser(null);
          tokenRef.current = null;
          window.location.reload();
        } else if (e.newValue !== tokenRef.current) {
          // Token changed (different user)
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkTokenExpiration, clearAuthAndRedirect]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });

      // Store tokens and user data
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.access);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);

      // Store tokens and user data if available
      if (response.access) {
        localStorage.setItem('access_token', response.access);
        setToken(response.access);
      }
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      }

      return response.user;
    } catch (error) {
      throw error;
    }
  };



  const sendOtp = async (email: string) => {
    await authAPI.sendOtp(email);
  }

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await authAPI.verifyOtp(email, otp);
      // Store tokens and user data
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.access);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  }

  const forgotPassword = async (email: string) => {
    await authAPI.forgotPassword(email);
  }

  const resetPassword = async (data: any) => {
    await authAPI.resetPassword(data);
  }

  const logout = () => {
    clearAuthAndRedirect();
  };

  const updateUser = (userData: AuthResponse['user']) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const switchRole = async () => {
    if (!token) throw new Error('Not authenticated');
    try {
      const response = await authAPI.switchRole(token);
      updateUser(response.user);
      return response.user;
    } catch (error) {
      toast.error('Failed to switch role');
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    register,

    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    switchRole,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
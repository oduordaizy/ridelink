'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, AuthResponse, RegisterData } from '../services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (username: string, password: string) => Promise<AuthResponse['user']>;
  register: (data: RegisterData) => Promise<AuthResponse['user']>;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<AuthResponse['user']>;
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

  // Function to clear auth state and redirect to login
  const clearAuthAndRedirect = useCallback((message?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    if (message) {
      toast.error('Session Expired', { description: message });
    }

    // Redirect to login page
    if (typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [router]);

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      // Clear auth state but don't redirect - let individual pages handle redirects
      setToken(null);
      setUser(null);
      return false;
    }

    try {
      const parts = storedToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Handle URL-safe base64 and decoding safely
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Clear expired token
        setToken(null);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking token:', error);
      // Clear invalid token
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return false;
    }
  }, []);

  // Check auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      if (checkTokenExpiration()) {
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

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
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
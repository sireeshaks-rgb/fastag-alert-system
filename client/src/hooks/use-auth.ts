import { useState, useCallback, useEffect } from 'react';
import type { UserResponse } from '@shared/routes';

export interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, roleId: number) => Promise<void>;
}

const STORAGE_KEY = 'fastag_auth_token';
const USER_STORAGE_KEY = 'fastag_user';

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('[Auth] Attempting login with email:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Auth] Login response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[Auth] Login error response:', error);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[Auth] Login successful, received user:', data.user.email);
      
      // Set state immediately
      setToken(data.token);
      setUser(data.user);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      
      console.log('[Auth] Token and user stored in localStorage');
      console.log('[Auth] User state should now be:', data.user);
    } catch (err) {
      console.error('[Auth] Login error:', err);
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, roleId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, roleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      // Auto-login after registration
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  return { user, token, isLoading, login, logout, register };
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

function validateToken(token: string): { isValid: boolean; reason: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: 'invalid-token' };
    }

    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) {
      payloadStr += '=';
    }

    const decodedPayload = atob(payloadStr);
    const payload = JSON.parse(decodedPayload);

    if (!payload || !payload.sub || typeof payload.exp !== 'number') {
      return { isValid: false, reason: 'invalid-token' };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return { isValid: false, reason: 'session-expired' };
    }

    return { isValid: true, reason: 'valid' };
  } catch (error) {
    console.error('Token validation error:', error);
    return { isValid: false, reason: 'invalid-token' };
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const cookieToken = getCookie('pmis-token');
    const localStorageToken = localStorage.getItem('pmis-token');
    const storedUser = localStorage.getItem('pmis-user');

    const activeToken = cookieToken || localStorageToken;

    if (activeToken && storedUser) {
      const validation = validateToken(activeToken);

      if (!validation.isValid) {
        console.log('AuthContext - Token validation failed:', validation.reason);
        localStorage.removeItem('pmis-token');
        localStorage.removeItem('pmis-user');
        deleteCookie('pmis-token');
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(activeToken);

        if (!getCookie('pmis-token')) {
          setCookie('pmis-token', activeToken);
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('pmis-token');
        localStorage.removeItem('pmis-user');
        deleteCookie('pmis-token');
        setUser(null);
        setToken(null);
      }
    } else if (activeToken || storedUser) {
      console.log('AuthContext - Inconsistent auth data, clearing');
      localStorage.removeItem('pmis-token');
      localStorage.removeItem('pmis-user');
      deleteCookie('pmis-token');
      setUser(null);
      setToken(null);
    } else if (!localStorageToken && !storedUser && cookieToken) {
      console.log('AuthContext - Token only in cookie, clearing cookie');
      deleteCookie('pmis-token');
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login({ email, password });

      const userData: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      };

      setUser(userData);
      setToken(response.token.token);
      localStorage.setItem('pmis-user', JSON.stringify(userData));
      localStorage.setItem('pmis-token', response.token.token);
      setCookie('pmis-token', response.token.token, 1);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pmis-user');
    localStorage.removeItem('pmis-token');
    deleteCookie('pmis-token');
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('pmis-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user && !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

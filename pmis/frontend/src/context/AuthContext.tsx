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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [foundAuthData, setFoundAuthData] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('pmis-user');
      const storedToken = localStorage.getItem('pmis-token') || getCookie('pmis-token');
      
      if (storedUser && storedToken) {
        setFoundAuthData(true);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        
        if (!localStorage.getItem('pmis-token')) {
          localStorage.setItem('pmis-token', storedToken);
        }
        if (!getCookie('pmis-token')) {
          setCookie('pmis-token', storedToken);
        }
      } else {
        setFoundAuthData(false);
      }
      
      setCheckedStorage(true);
    } else {
      setCheckedStorage(true);
      setFoundAuthData(false);
    }
  }, []);

  useEffect(() => {
    if (checkedStorage) {
      if (foundAuthData) {
        if (user && token) {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [checkedStorage, foundAuthData, user, token]);

  const login = async (email: string, password: string): Promise<boolean> => {
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

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pmis-user');
    localStorage.removeItem('pmis-token');
    deleteCookie('pmis-token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user && !!token, loading }}>
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
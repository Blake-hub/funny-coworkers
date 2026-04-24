import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fake credentials
const FAKE_USER: User = {
  id: '1',
  email: 'admin@pmis.com',
  name: 'John Doe',
  role: 'Project Manager',
};

const FAKE_CREDENTIALS = {
  email: 'admin@pmis.com',
  password: 'admin',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('pmis-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    if (email === FAKE_CREDENTIALS.email && password === FAKE_CREDENTIALS.password) {
      setUser(FAKE_USER);
      localStorage.setItem('pmis-user', JSON.stringify(FAKE_USER));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pmis-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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

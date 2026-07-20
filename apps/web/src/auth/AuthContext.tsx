// apps/web/src/auth/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiClient, setAccessToken } from '../api/client';

interface User {
  userId: string;
  organizationId: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    organizationId: string,
    role: string,
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // No token is persisted anywhere (by design — in-memory only), so there's
  // nothing to restore on mount. loading starts false immediately; no
  // useEffect needed since there's no external system to synchronize with yet.
  const [loading] = useState(false);

  async function login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    const me = await apiClient.get('/users/me');
    setUser(me.data);
  }

  async function signup(
    email: string,
    password: string,
    organizationId: string,
    role: string,
  ) {
    const { data } = await apiClient.post('/auth/signup', {
      email,
      password,
      organizationId,
      role,
    });
    setAccessToken(data.accessToken);
    const me = await apiClient.get('/users/me');
    setUser(me.data);
  }

  function logout() {
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

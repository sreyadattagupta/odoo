import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, User } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (body: Record<string, string>) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const { user } = await api<{ user: User }>('/auth/me');
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMe(); }, []);

  async function login(email: string, password: string) {
    const { token, user } = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    setUser(user);
  }

  async function signup(body: Record<string, string>) {
    const { token, user } = await api<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, refresh: loadMe }}>
      {children}
    </Ctx.Provider>
  );
}

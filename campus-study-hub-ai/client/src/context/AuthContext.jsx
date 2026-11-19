import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const adopt = useCallback(data => { setAccessToken(data.accessToken); setUser(data.user); return data.user; }, []);
  useEffect(() => {
    let active = true;
    api.post('/auth/refresh').then(({ data }) => { if (active) adopt(data); }).catch(() => { setAccessToken(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [adopt]);
  const login = async credentials => adopt((await api.post('/auth/login', credentials)).data);
  const register = async details => adopt((await api.post('/auth/register', details)).data);
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setAccessToken(null); setUser(null); } };
  const updateUser = next => setUser(prev => ({ ...prev, ...next }));
  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

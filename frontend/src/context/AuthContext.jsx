import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [githubStatus, setGithubStatus] = useState({ connected: false, connections: [], loading: true });
  const githubPollRef = useRef(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGithubStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/oauth/github/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const conns = data.connections || [];
      const active = conns.find((c) => c.status === 'active');
      setGithubStatus({ connected: !!active, connections: conns, active: active || null, loading: false });
    } catch {
      setGithubStatus((prev) => ({ ...prev, connected: false, connections: [], active: null, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user) {
      fetchGithubStatus();
    } else {
      setGithubStatus({ connected: false, connections: [], active: null, loading: false });
    }
  }, [user, fetchGithubStatus]);

  const startGithubPolling = useCallback((state, onFound) => {
    if (githubPollRef.current) clearInterval(githubPollRef.current);

    let attempts = 0;
    let delay = 5000;
    const startTime = Date.now();
    const MAX_DURATION = 5 * 60 * 1000;

    const tick = async () => {
      if (Date.now() - startTime > MAX_DURATION) {
        clearInterval(githubPollRef.current);
        githubPollRef.current = null;
        return;
      }
      if (document.hidden) return;

      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/oauth/github/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ state }),
        });
        const data = await res.json();
        if (data.connection) {
          clearInterval(githubPollRef.current);
          githubPollRef.current = null;
          await fetchGithubStatus();
          onFound?.(data.connection);
        } else if (attempts >= 3 && delay < 15000) {
          clearInterval(githubPollRef.current);
          delay = 15000;
          githubPollRef.current = setInterval(tick, delay);
        }
      } catch {
        // keep polling
      }
    };

    githubPollRef.current = setInterval(tick, delay);
  }, [fetchGithubStatus]);

  const stopGithubPolling = useCallback(() => {
    if (githubPollRef.current) {
      clearInterval(githubPollRef.current);
      githubPollRef.current = null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    stopGithubPolling();
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setGithubStatus({ connected: false, connections: [], active: null, loading: false });
  }, [stopGithubPolling]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkSession,
        githubStatus,
        fetchGithubStatus,
        startGithubPolling,
        stopGithubPolling,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

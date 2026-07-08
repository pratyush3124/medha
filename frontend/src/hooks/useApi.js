import { useCallback, useMemo } from 'react';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL || '';

export function useApi() {
  const request = useCallback(async (path, options = {}) => {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
    });
    return res;
  }, []);

  const get = useCallback((path) => request(path), [request]);

  const post = useCallback(
    (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    [request]
  );

  const del = useCallback((path) => request(path, { method: 'DELETE' }), [request]);

  return useMemo(() => ({ get, post, del, request }), [get, post, del, request]);
}

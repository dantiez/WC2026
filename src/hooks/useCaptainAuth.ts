import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

interface CaptainAuthState {
  loading: boolean;
  email: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useCaptainAuth(): CaptainAuthState {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.auth.me();
      setEmail(res.authenticated && res.email ? res.email : null);
    } catch {
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setEmail(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, email, refresh, logout };
}

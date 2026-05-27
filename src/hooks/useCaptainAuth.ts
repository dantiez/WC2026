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
    // Member-only routes don't need a captain cookie — skip the round-trip
    // entirely on /t/* (~600ms cold-start saved). The hook still runs on
    // /captain* and the root redirect.
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/t/")
    ) {
      setEmail(null);
      setLoading(false);
      return;
    }
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

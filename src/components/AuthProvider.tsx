"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인 - 서버에서 HttpOnly 쿠키 기반 세션을 읽어 옵니다.
    // Client-side Supabase instance does not read HttpOnly cookies by
    // default, so call our server endpoint which returns session/user info.
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'include' });
        const data = await res.json();
        if (data?.hasSession && data.user) {
          // Create a minimal user-like object so components that expect
          // `user` truthiness behave correctly.
          setUser({ id: data.user.id, app_metadata: { role: data.user.role } } as unknown as User);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    // Optionally subscribe to client-side auth changes (kept for oauth flows)
    // but prefer server-based session check above for HttpOnly cookie sessions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Call server logout to ensure HttpOnly session cookie is cleared.
      const res = await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setUser(null);
      } else {
        // Fallback to client signOut if server call fails.
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (e) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

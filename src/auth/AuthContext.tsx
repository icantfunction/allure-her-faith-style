import React, { createContext, useContext, useEffect, useState } from "react";
import { getIdToken, signIn as doSignIn, signOut as doSignOut } from "./cognito";
import { setAdminToken, clearAdminToken } from "@/api/allureherApi";

type AuthState = {
  authed: boolean;
  loading: boolean;
  signIn: (u: string, p: string) => Promise<void>;
  signOut: () => void;
  idToken: string | null;
};

const AuthCtx = createContext<AuthState>({
  authed: false,
  loading: true,
  signIn: async () => {},
  signOut: () => {},
  idToken: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await getIdToken();
        setIdToken(t);
        setAdminToken(t); // Sync token for allureherApi
        setAuthed(true);
      } catch {
        setAuthed(false);
        setIdToken(null);
        clearAdminToken(); // Ensure clean state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (u: string, p: string) => {
    setLoading(true);
    try {
      await doSignIn(u, p);
      const t = await getIdToken();
      setIdToken(t);
      setAdminToken(t); // Sync token for allureherApi
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    doSignOut();
    clearAdminToken(); // Clear token for allureherApi
    setAuthed(false);
    setIdToken(null);
  };

  return (
    <AuthCtx.Provider value={{ authed, loading, signIn, signOut, idToken }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

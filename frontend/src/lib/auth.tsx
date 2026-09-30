import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api, setUnauthorizedHandler, type Usuario } from "@/lib/api";

type AuthContextValue = {
  user: Usuario | null;
  loading: boolean;
  error: unknown;
  isAdmin: boolean;
  refetch: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  // Drops every cached query except the session itself. Not qc.clear(): that would also delete the
  // "me" query the provider is observing, and the screen would stop reacting to login/logout.
  const dropCachedData = () => qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });

  const meQ = useQuery({
    queryKey: ["me"],
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        return (await api.get<{ user: Usuario }>("/api/me")).data.user;
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return null; // not logged in
        throw e;
      }
    },
  });

  // Any 401 from the API (expired session, deactivated account) sends the user back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      dropCachedData();
      qc.setQueryData(["me"], null);
    });
    return () => setUnauthorizedHandler(null);
  }, [qc]);

  async function login(username: string, password: string) {
    const { data } = await api.post<{ user: Usuario }>("/api/login", {
      username,
      password,
    });
    dropCachedData(); // never show another user's cached data
    qc.setQueryData(["me"], data.user);
  }

  async function logout() {
    try {
      await api.post("/api/logout");
    } finally {
      dropCachedData();
      qc.setQueryData(["me"], null);
    }
  }

  const user = meQ.data ?? null;
  return (
    <AuthContext.Provider
      value={{
        user,
        loading: meQ.isLoading,
        error: meQ.error,
        isAdmin: user?.role === "admin",
        refetch: () => meQ.refetch(),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// client/src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);

  const { isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const data = await api.get("/auth/me");
        setUser(data.user);
        return data.user;
      } catch {
        setUser(null);
        return null;
      }
    },
  });

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    setUser(data.user);
    qc.invalidateQueries({ queryKey: ["me"] });
    return data.user;
  }

  async function register(payload) {
    const data = await api.post("/auth/register", payload);
    setUser(data.user);
    qc.invalidateQueries({ queryKey: ["me"] });
    return data.user;
  }

  async function logout() {
    await api.post("/auth/logout", {});
    setUser(null);
    qc.clear();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

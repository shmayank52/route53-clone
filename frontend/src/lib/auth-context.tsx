"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "./api";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("r53_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("r53_token") : null;
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore malformed cache
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { access_token, user: u } = res.data;
      localStorage.setItem("r53_token", access_token);
      localStorage.setItem("r53_user", JSON.stringify(u));
      setUser(u);
      router.push("/hosted-zones");
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }, [router]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const res = await api.post("/api/auth/register", { email, password, full_name: fullName });
      const { access_token, user: u } = res.data;
      localStorage.setItem("r53_token", access_token);
      localStorage.setItem("r53_user", JSON.stringify(u));
      setUser(u);
      router.push("/hosted-zones");
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("r53_token");
    localStorage.removeItem("r53_user");
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

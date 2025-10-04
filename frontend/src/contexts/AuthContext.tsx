"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/authApi";

type UserRole = "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN" | null;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 🔹 Check token & user trong localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔹 Login + Redirect
  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      const { tokens, user } = res.data.data;

      // Lưu token & user
      localStorage.setItem("auth_token", tokens.accessToken);
      localStorage.setItem("refresh_token", tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // 🔹 Redirect theo role
      if (user.role === "ADMIN" || user.role?.startsWith("EVM")) {
        router.push("/evm/dashboard");
      } else {
        router.push("/dealer/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // 🔹 Logout
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

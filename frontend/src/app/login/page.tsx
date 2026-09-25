"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { notify } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        notify("success", "Signed in successfully");
      } else {
        await register(email, password, fullName);
        notify("success", "Account created", "Welcome to Route 53 Console");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-awsBg flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-awsOrange text-3xl">▲</span>
        <span className="text-2xl font-bold text-awsSquid">aws</span>
      </div>

      <div className="w-full max-w-sm aws-panel p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-awsText mb-1">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-awsGray mb-4">
          {mode === "login"
            ? "Route 53 Management Console (demo)"
            : "Create a demo account to get started"}
        </p>

        {error && (
          <div className="mb-3 border-l-4 border-[#d13212] bg-[#fdf3f1] text-[#d13212] text-sm px-3 py-2 rounded-[3px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="aws-label">Full name</label>
              <input
                className="aws-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div>
            <label className="aws-label">Email</label>
            <input
              type="email"
              required
              className="aws-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="aws-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="aws-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={submitting} className="aws-btn-primary w-full mt-2">
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" ? (
            <button className="text-awsBlue hover:underline" onClick={() => setMode("register")}>
              Need an account? Create one
            </button>
          ) : (
            <button className="text-awsBlue hover:underline" onClick={() => setMode("login")}>
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-awsGray mt-6 max-w-sm text-center">
        This is a portfolio clone of the AWS Route 53 console for demonstration purposes only.
        Authentication is mocked and not connected to real AWS services.
      </p>
    </div>
  );
}

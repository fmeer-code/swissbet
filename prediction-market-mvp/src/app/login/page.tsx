"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-sm text-[var(--color-text-secondary)] mb-6">
          Log in to continue predicting the future.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="field-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="alert-error text-xs mt-1">
              {error}
            </p>
          )}

          <button className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-[var(--color-primary)] hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
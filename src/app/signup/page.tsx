"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Signup failed.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        predict_score: 0,
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-xl font-semibold">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">Username (public)</label>
          <input
            className="input"
            type="text"
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
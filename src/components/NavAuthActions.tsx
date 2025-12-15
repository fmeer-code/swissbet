"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; username: string | null };

export default function NavAuthActions() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "signed-out" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      setState({ status: "signed-in", username: profile?.username ?? null });
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setState({ status: "signed-out" });
        return;
      }
      load();
    });

    load();

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return null;
  }

  if (state.status === "signed-in") {
    return state.username ? (
      <Link
        className="btn btn-secondary btn-sm"
        href={`/profile/${state.username}`}
      >
        Profile
      </Link>
    ) : (
      <span className="text-xs text-[var(--color-text-secondary)]">
        Profile unavailable
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link className="btn btn-secondary btn-sm" href="/login">
        Login
      </Link>
      <Link className="btn btn-primary btn-sm" href="/signup">
        Signup
      </Link>
    </div>
  );
}

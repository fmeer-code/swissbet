"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type AdminState = "loading" | "show" | "hide";

export default function AdminNavLink() {
  const [state, setState] = useState<AdminState>("loading");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState("hide");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setState(profile?.is_admin ? "show" : "hide");
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          setState("hide");
          return;
        }
        load();
      }
    );

    load();

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  if (state !== "show") {
    return null;
  }

  return (
    <Link className="nav-link" href="/admin">
      Admin
    </Link>
  );
}

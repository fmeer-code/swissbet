"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setLoading(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button className="btn btn-secondary btn-sm" onClick={handleLogout} disabled={loading}>
        {loading ? "Logging out..." : "Log out"}
      </button>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}

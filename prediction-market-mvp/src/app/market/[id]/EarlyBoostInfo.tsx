"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BoostState =
  | { status: "loading" }
  | { status: "no-user" }
  | { status: "no-vote" }
  | { status: "ready"; multiplier: number; position: number; total: number };

function multiplierForPercentile(p: number): number {
  if (p <= 0.01) return 1.0;
  if (p <= 0.1) return 0.9;
  if (p <= 0.5) return 0.8;
  if (p <= 0.9) return 0.7;
  return 0.5;
}

export default function EarlyBoostInfo({ marketId }: { marketId: string }) {
  const [state, setState] = useState<BoostState>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      setState({ status: "loading" });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState({ status: "no-user" });
        return;
      }

      const { data: vote } = await supabase
        .from("votes")
        .select("final_lock_time")
        .eq("market_id", marketId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!vote?.final_lock_time) {
        setState({ status: "no-vote" });
        return;
      }

      const [{ count: total = 0 }, { count: position = 0 }] = await Promise.all([
        supabase
          .from("votes")
          .select("*", { head: true, count: "exact" })
          .eq("market_id", marketId),
        supabase
          .from("votes")
          .select("*", { head: true, count: "exact" })
          .eq("market_id", marketId)
          .lte("final_lock_time", vote.final_lock_time),
      ]);

      const safeTotal = total || 1;
      const safePosition = Math.max(1, position || 1);
      const percentile =
        safeTotal === 1 ? 0 : (safePosition - 1) / (safeTotal - 1);
      const multiplier = multiplierForPercentile(percentile);

      setState({
        status: "ready",
        multiplier,
        position: safePosition,
        total: safeTotal,
      });
    };

    load();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.marketId !== marketId) return;
      load();
    };

    window.addEventListener("vote-updated", handler);
    return () => {
      window.removeEventListener("vote-updated", handler);
    };
  }, [marketId]);

  if (state.status === "loading") {
    return (
      <p className="text-[10px] text-[var(--color-text-secondary)]">
        Calculating your boost...
      </p>
    );
  }

  if (state.status === "no-user") {
    return (
      <p className="text-[10px] text-[var(--color-text-secondary)]">
        Log in and vote to see your early boost.
      </p>
    );
  }

  if (state.status === "no-vote") {
    return (
      <p className="text-[10px] text-[var(--color-text-secondary)]">
        Vote to get an early commit boost.
      </p>
    );
  }

  return (
    <p className="text-[10px] text-[var(--color-text-secondary)]">
      Early boost: <span className="font-semibold">{state.multiplier.toFixed(1)}x</span>{" "}
      (position {state.position}/{state.total})
    </p>
  );
}

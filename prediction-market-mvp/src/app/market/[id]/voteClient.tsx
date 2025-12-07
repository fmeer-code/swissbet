"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Props {
  marketId: string;
  marketStatus: string;
}

export default function VoteClient({ marketId, marketStatus }: Props) {
  const router = useRouter();
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryPct, setEntryPct] = useState<number | null>(null);
  const [switchPenaltyTotal, setSwitchPenaltyTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("votes")
        .select("final_choice, entry_pct, switch_penalty_total")
        .eq("market_id", marketId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.final_choice) {
        setChoice(data.final_choice);
        setEntryPct(data.entry_pct ?? null);
        setSwitchPenaltyTotal(Number(data.switch_penalty_total) || 0);
      }
    };
    load();
  }, [marketId]);

  async function handleVote(newChoice: "yes" | "no") {
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please log in to vote.");
      setLoading(false);
      return;
    }

    // Fetch current vote row for penalty tracking
    const { data: existing } = await supabase
      .from("votes")
      .select("final_choice, entry_pct, switch_penalty_total")
      .eq("market_id", marketId)
      .eq("user_id", user.id)
      .maybeSingle();

    // Current crowd percentages before applying this change
    const [{ count: yesCount = 0 }, { count: noCount = 0 }] = await Promise.all([
      supabase
        .from("votes")
        .select("*", { head: true, count: "exact" })
        .eq("market_id", marketId)
        .eq("final_choice", "yes"),
      supabase
        .from("votes")
        .select("*", { head: true, count: "exact" })
        .eq("market_id", marketId)
        .eq("final_choice", "no"),
    ]);

    const total = yesCount + noCount || 1; // avoid divide by zero
    const yesPct = (yesCount / total) * 100;
    const noPct = (noCount / total) * 100;

    if (choice === newChoice) {
      const confirmed = window.confirm(
        "Remove your vote? This will clear your current answer (no switch penalty applied)."
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }
      const { error: deleteError } = await supabase
        .from("votes")
        .delete()
        .eq("market_id", marketId)
        .eq("user_id", user.id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        setChoice(null);
        setEntryPct(null);
        setSwitchPenaltyTotal(0);
      }
      setLoading(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vote-updated", { detail: { marketId } }));
      }
      router.refresh();
      return;
    }

    let newEntryPct = newChoice === "yes" ? yesPct : noPct;
    let newSwitchPenaltyTotal = Number(existing?.switch_penalty_total) || 0;

    let pendingPenalty = 0;
    if (existing?.final_choice && existing.final_choice !== newChoice) {
      const prevEntryPct =
        existing.entry_pct ??
        (existing.final_choice === "yes" ? yesPct : noPct);
      const prevExitPct = existing.final_choice === "yes" ? yesPct : noPct;
      pendingPenalty = Math.max(0, prevEntryPct - prevExitPct);
      newSwitchPenaltyTotal += pendingPenalty;
    }

    if (pendingPenalty > 0) {
      const confirmMsg = `Are you sure you want to change your vote? You will lose approximately ${pendingPenalty.toFixed(
        1
      )} points from switching.`;
      const confirmed = window.confirm(confirmMsg);
      if (!confirmed) {
        setLoading(false);
        return;
      }
    }

    const { error: upsertError } = await supabase.from("votes").upsert({
      market_id: marketId,
      user_id: user.id,
      final_choice: newChoice,
      final_lock_time: new Date().toISOString(),
      entry_pct: newEntryPct,
      switch_penalty_total: newSwitchPenaltyTotal,
    });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setChoice(newChoice);
      setEntryPct(newEntryPct);
      setSwitchPenaltyTotal(newSwitchPenaltyTotal);
    }
    setLoading(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vote-updated", { detail: { marketId } }));
    }
    router.refresh();
  }

  if (marketStatus !== "open") {
    return (
      <p className="text-xs text-[var(--color-text-secondary)]">
        Voting is closed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-secondary)]">
        Choose YES or NO. You can change your answer until the market closes.
      </p>
      <div className="flex gap-3">
        <button
          className={`btn-primary flex-1 ${
            choice === "yes" ? "" : "opacity-80"
          }`}
          disabled={loading}
          onClick={() => handleVote("yes")}
        >
          YES {choice === "yes" && "✓"}
        </button>
        <button
          className={`btn-secondary flex-1 ${
            choice === "no" ? "border-[var(--color-primary)]" : ""
          }`}
          disabled={loading}
          onClick={() => handleVote("no")}
        >
          NO {choice === "no" && "✓"}
        </button>
      </div>
      {choice && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Your current answer:{" "}
          <span className="font-semibold uppercase">{choice}</span>
        </p>
      )}
      {switchPenaltyTotal > 0 && (
        <p className="text-[10px] text-[var(--color-warning)]">
          Switching penalties so far: {switchPenaltyTotal.toFixed(1)}
        </p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// src/lib/scoring.ts
import { supabaseServer } from "./supabaseServer";

type Outcome = "yes" | "no";

const DEFAULT_MIN_VOTERS = 20;

async function getMinVoters(): Promise<number> {
  try {
    const { data, error } = await supabaseServer
      .from("settings")
      .select("value")
      .eq("key", "min_voters_scoring")
      .maybeSingle();
    if (error || data?.value == null) return DEFAULT_MIN_VOTERS;
    const parsed = Number(
      typeof data.value === "number" ? data.value : parseInt(data.value, 10),
    );
    return Number.isNaN(parsed) ? DEFAULT_MIN_VOTERS : Math.max(0, parsed);
  } catch {
    return DEFAULT_MIN_VOTERS;
  }
}

export async function scoreMarket(marketId: string, outcome: Outcome) {
  const MIN_VOTERS = await getMinVoters();

  // Get votes
  const { data: votes, error: votesError } = await supabaseServer
    .from("votes")
    .select("user_id, final_choice, final_lock_time, switch_penalty_total")
    .eq("market_id", marketId)
    .order("final_lock_time", { ascending: true });

  if (votesError) throw new Error(votesError.message);

  const total = votes?.length || 0;
  if (!votes || total < MIN_VOTERS) {
    // Mark market as resolved but unscored
    await supabaseServer
      .from("markets")
      .update({
        status: "resolved",
        winning_outcome: outcome,
        final_yes_pct: null,
        final_no_pct: null,
      })
      .eq("id", marketId);
    return { scored: false, reason: "not_enough_voters" };
  }

  const yesCount = votes.filter((v) => v.final_choice === "yes").length;
  const noCount = total - yesCount;

  const yesPct = (yesCount / total) * 100;
  const noPct = (noCount / total) * 100;

  // Save final percentages & status
  await supabaseServer
    .from("markets")
    .update({
      final_yes_pct: yesPct,
      final_no_pct: noPct,
      winning_outcome: outcome,
      status: "resolved",
    })
    .eq("id", marketId);

  // Compute base deltas
  const baseDeltaForChoice = (choice: Outcome): number => {
    if (outcome === "yes") {
      if (choice === "yes") return noPct; // gain
      return -yesPct; // lose
    } else {
      // outcome === 'no'
      if (choice === "no") return yesPct;
      return -noPct;
    }
  };

  // Vote order percentile and multiplier
  const N = total;
  const withPosition = votes.map((v, idx) => {
    const position = idx + 1;
    const votePercentile = (position - 1) / (N - 1);
    let multiplier: number;
    if (votePercentile <= 0.01) multiplier = 1.0;
    else if (votePercentile <= 0.1) multiplier = 0.9;
    else if (votePercentile <= 0.5) multiplier = 0.8;
    else if (votePercentile <= 0.9) multiplier = 0.7;
    else multiplier = 0.5;

    return {
      ...v,
      position,
      votePercentile,
      multiplier,
    };
  });

  // Get current scores
  const userIds = Array.from(new Set(votes.map((v) => v.user_id)));
  const { data: profiles, error: profilesError } = await supabaseServer
    .from("profiles")
    .select("id, smart_score")
    .in("id", userIds);

  if (profilesError) throw new Error(profilesError.message);

  const scoreMap = new Map<string, number>();
  profiles?.forEach((p) => scoreMap.set(p.id, Number(p.smart_score)));

  // Apply deltas
  for (const v of withPosition) {
    const baseDelta = baseDeltaForChoice(v.final_choice as Outcome);
    const switchPenalty = Number(v.switch_penalty_total) || 0;
    const finalDelta = baseDelta * v.multiplier - switchPenalty;
    const before = scoreMap.get(v.user_id) ?? 0;
    const after = before + finalDelta;

    // Update profiles
    await supabaseServer
      .from("profiles")
      .update({ smart_score: after })
      .eq("id", v.user_id);

    // Insert score_changes
    await supabaseServer.from("score_changes").insert({
      market_id: marketId,
      user_id: v.user_id,
      base_delta: baseDelta,
      multiplier: v.multiplier,
      final_delta: finalDelta,
      smart_score_before: before,
      smart_score_after: after,
    });
  }

  return { scored: true, voters: total, yesPct, noPct };
}

// src/app/market/[id]/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import MarketChart from "@/components/MarketChart";
import VoteClient from "./voteClient";
import EarlyBoostInfo from "./EarlyBoostInfo";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params;
  const marketId = id;

  const { data: market, error: marketError } = await supabaseServer
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  if (marketError || !market) {
    return <p className="field-error">Market not found.</p>;
  }

  const insufficientVotes =
    market.status === "resolved" &&
    market.final_yes_pct == null &&
    market.final_no_pct == null;

  const { data: snapshots } = await supabaseServer
    .from("market_snapshots")
    .select("snapshot_time, yes_pct, no_pct")
    .eq("market_id", marketId)
    .order("snapshot_time", { ascending: true });

  const { count: voteCount = 0 } = await supabaseServer
    .from("votes")
    .select("*", { head: true, count: "exact" })
    .eq("market_id", marketId);

  const [{ count: yesCount = 0 }, { count: noCount = 0 }] = await Promise.all([
    supabaseServer
      .from("votes")
      .select("*", { head: true, count: "exact" })
      .eq("market_id", marketId)
      .eq("final_choice", "yes"),
    supabaseServer
      .from("votes")
      .select("*", { head: true, count: "exact" })
      .eq("market_id", marketId)
      .eq("final_choice", "no"),
  ]);

  let graphMinVotes = 5;
  try {
    const { data: settingsRow, error: settingsError } = await supabaseServer
      .from("settings")
      .select("value")
      .eq("key", "graph_min_votes")
      .maybeSingle();
    if (!settingsError && settingsRow?.value != null) {
      const parsed = Number(
        typeof settingsRow.value === "number"
          ? settingsRow.value
          : parseInt(settingsRow.value as any, 10)
      );
      if (!Number.isNaN(parsed)) {
        graphMinVotes = Math.max(0, parsed);
      }
    }
  } catch (err) {
    // If settings table is missing, fall back to default.
  }

  const snapshotsWithFallback =
    snapshots && snapshots.length > 0
      ? snapshots
      : voteCount > 0
      ? [
          {
            snapshot_time: new Date().toISOString(),
            yes_pct: (yesCount / Math.max(1, yesCount + noCount)) * 100,
            no_pct: (noCount / Math.max(1, yesCount + noCount)) * 100,
          },
        ]
      : [];

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-lg font-semibold">{market.question}</h1>
        {market.description && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {market.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>Category: {market.category || "General"}</span>
          <span>Closes: {new Date(market.close_time).toLocaleString()}</span>
          <span>Status: {market.status}</span>
        </div>
        {insufficientVotes && (
          <p className="mt-3 text-xs text-[var(--color-warning)]">
            Not enough votes to award points on resolution.
          </p>
        )}
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Market sentiment</h2>
          <EarlyBoostInfo marketId={marketId} />
        </div>
        <MarketChart
          snapshots={snapshotsWithFallback}
          voteCount={voteCount || 0}
          minVotes={graphMinVotes}
        />
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold">Your prediction</h2>
        <VoteClient marketId={marketId} marketStatus={market.status} />
      </div>
    </div>
  );
}

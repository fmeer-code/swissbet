// src/lib/snapshots.ts
import { supabaseServer } from "./supabaseServer";

export async function snapshotMarket(marketId: string) {
  const { data: votes } = await supabaseServer
    .from("votes")
    .select("final_choice")
    .eq("market_id", marketId);

  if (!votes || votes.length === 0) return;

  const total = votes.length;
  const yesCount = votes.filter((v) => v.final_choice === "yes").length;
  const noCount = total - yesCount;

  const yesPct = (yesCount / total) * 100;
  const noPct = (noCount / total) * 100;

  await supabaseServer.from("market_snapshots").insert({
    market_id: marketId,
    yes_pct: yesPct,
    no_pct: noPct,
  });
}
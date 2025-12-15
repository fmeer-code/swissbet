// src/app/api/markets/close-overdue/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Call this endpoint (e.g., via cron) to close markets whose close_time has passed.
export async function GET() {
  const nowIso = new Date().toISOString();

  const { data: openMarkets, error: fetchError } = await supabaseServer
    .from("markets")
    .select("id")
    .eq("status", "open")
    .lte("close_time", nowIso);

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  if (!openMarkets || openMarkets.length === 0) {
    return NextResponse.json({ closed: 0, message: "No overdue markets." });
  }

  const ids = openMarkets.map((m) => m.id);

  const { error: updateError } = await supabaseServer
    .from("markets")
    .update({ status: "closed" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ closed: ids.length });
}

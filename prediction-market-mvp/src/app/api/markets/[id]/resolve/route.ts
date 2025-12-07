// src/app/api/markets/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scoreMarket } from "@/lib/scoring";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const marketId = id;
  const body = await req.json().catch(() => null);

  const outcome = body?.outcome;
  if (outcome !== "yes" && outcome !== "no") {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  try {
    const result = await scoreMarket(marketId, outcome);
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Scoring failed" },
      { status: 500 },
    );
  }
}

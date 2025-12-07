// src/app/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 10; // ISR: refresh every 10s

export default async function MarketsPage() {
  const [{ data: openMarkets }, { data: closedMarkets }] = await Promise.all([
    supabaseServer
      .from("markets")
      .select("id, question, category, status, close_time, final_yes_pct, final_no_pct")
      .eq("status", "open")
      .order("close_time", { ascending: true }),
    supabaseServer
      .from("markets")
      .select("id, question, category, status, close_time, final_yes_pct, final_no_pct")
      .in("status", ["closed", "resolved"])
      .order("close_time", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Open markets</h1>
      </div>
      <div className="space-y-3">
        {openMarkets && openMarkets.length > 0 ? (
          openMarkets.map((m) => (
            <Link key={m.id} href={`/market/${m.id}`} className="block card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">{m.question}</h2>
                  {m.category && (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {m.category}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Closes: {new Date(m.close_time).toLocaleString()}
                  </p>
                </div>
                {m.status !== "open" && m.final_yes_pct != null && (
                  <div className="text-right text-xs">
                    <p className="text-[var(--color-text-secondary)]">Final</p>
                    <p>YES {(m.final_yes_pct as number).toFixed(0)}%</p>
                    <p>NO {(m.final_no_pct as number).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No markets yet.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-4">
        <h2 className="text-xl font-semibold">Closed markets</h2>
      </div>
      <div className="space-y-3">
        {closedMarkets && closedMarkets.length > 0 ? (
          closedMarkets.map((m) => (
            <Link key={m.id} href={`/market/${m.id}`} className="block card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">{m.question}</h2>
                  {m.category && (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {m.category}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Closed: {new Date(m.close_time).toLocaleString()}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Status: {m.status}
                  </p>
                </div>
                {m.final_yes_pct != null && m.final_no_pct != null ? (
                  <div className="text-right text-xs">
                    <p className="text-[var(--color-text-secondary)]">Final</p>
                    <p>YES {(m.final_yes_pct as number).toFixed(0)}%</p>
                    <p>NO {(m.final_no_pct as number).toFixed(0)}%</p>
                  </div>
                ) : (
                  <div className="text-right text-xs text-[var(--color-warning)]">
                    <p>Not enough votes / no final percentages</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No closed markets yet.
          </p>
        )}
      </div>
    </div>
  );
}

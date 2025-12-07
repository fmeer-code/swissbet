import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 30;

export default async function LeaderboardPage() {
  const { data: profiles } = await supabaseServer
    .from("profiles")
    .select("username, smart_score")
    .order("smart_score", { ascending: false })
    .limit(100);

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-semibold">Global leaderboard</h1>
      {(!profiles || profiles.length === 0) && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Nobody has scored yet.
        </p>
      )}
      {profiles && profiles.length > 0 && (
        <table className="w-full border-separate border-spacing-y-1 text-xs">
          <thead className="text-[var(--color-text-secondary)]">
            <tr>
              <th className="text-left">#</th>
              <th className="text-left">User</th>
              <th className="text-right">SmartScore</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, idx) => (
              <tr key={p.username}>
                <td className="py-1 text-[var(--color-text-secondary)]">
                  {idx + 1}
                </td>
                <td className="py-1">{p.username}</td>
                <td className="py-1 text-right font-semibold">
                  {Number(p.smart_score).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
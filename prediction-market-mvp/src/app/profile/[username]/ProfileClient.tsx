"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileActions from "../ProfileActions";

type ScoreChange = {
  market_id: string;
  base_delta: number;
  final_delta: number;
  created_at: string;
};

type ProfileData = {
  id: string;
  username: string;
  predict_score: number;
};

interface Props {
  username: string;
}

export default function ProfileClient({ username }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<ScoreChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setProfile(null);
      setHistory([]);

      const normalized = username.trim();

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, predict_score")
        .ilike("username", normalized)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!profileRow) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      setProfile(profileRow);

      const { data: scoreHistory, error: historyError } = await supabase
        .from("score_changes")
        .select("market_id, base_delta, final_delta, created_at")
        .eq("user_id", profileRow.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (historyError) {
        setError(historyError.message);
      } else if (scoreHistory) {
        setHistory(scoreHistory);
      }

      setLoading(false);
    };

    load();
  }, [username]);

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">Loading profile…</p>
    );
  }

  if (error) {
    return <p className="field-error">{error}</p>;
  }

  if (!profile) {
    return <p className="field-error">User not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="card card-spaced">
        <h1 className="text-xl font-semibold">@{profile.username}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          predictScore:{" "}
          <span className="font-semibold">
            {Number(profile.predict_score).toFixed(1)}
          </span>
        </p>
        <ProfileActions />
      </div>

      <div className="card card-spaced">
        <h2 className="mb-2 text-sm font-semibold">Recent markets</h2>
        {history.length === 0 && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            No score changes yet.
          </p>
        )}
        {history.length > 0 && (
          <ul className="space-y-1 text-xs">
            {history.map((s) => (
              <li key={s.created_at}>
                <span className="text-[var(--color-text-secondary)]">
                  {new Date(s.created_at).toLocaleString()}:
                </span>{" "}
                <span>
                  Δ {Number(s.final_delta).toFixed(1)} (base{" "}
                  {Number(s.base_delta).toFixed(1)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

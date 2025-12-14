"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type GateState =
  | { status: "loading" }
  | { status: "no-user" }
  | { status: "no-admin" }
  | { status: "ready" };

type FormState = {
  question: string;
  description: string;
  category: string;
  closeTime: string;
  minVotes: number;
};

const emptyForm: FormState = {
  question: "",
  description: "",
  category: "politics",
  closeTime: "",
  minVotes: 0,
};

export default function AdminPanel() {
  const [gate, setGate] = useState<GateState>({ status: "loading" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thresholdMessage, setThresholdMessage] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [graphMinVotes, setGraphMinVotes] = useState<number>(5);
  const [minVoters, setMinVoters] = useState<number>(20);
  const [minVotersMessage, setMinVotersMessage] = useState<string | null>(null);
  const [minVotersError, setMinVotersError] = useState<string | null>(null);
  const [closeMessage, setCloseMessage] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closedMarkets, setClosedMarkets] = useState<
    { id: string; question: string; status: string; winning_outcome: string | null }[]
  >([]);
  const [closedLoading, setClosedLoading] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["graph_min_votes", "min_voters_scoring"]);
        if (!error && data) {
          data.forEach((row) => {
            const parsed = Number(
              typeof row.value === "number"
                ? row.value
                : parseInt(row.value, 10)
            );
            if (row.key === "graph_min_votes" && !Number.isNaN(parsed)) {
              setGraphMinVotes(parsed);
            }
            if (row.key === "min_voters_scoring" && !Number.isNaN(parsed)) {
              setMinVoters(parsed);
            }
          });
        }
      } catch (err) {
        // If the table doesn't exist yet, ignore and keep default.
      }
    };
    loadSetting();
  }, []);

  const loadClosedMarkets = async () => {
    setClosedLoading(true);
    setResolveMessage(null);
    setResolveError(null);
    const { data, error } = await supabase
      .from("markets")
      .select("id, question, status, winning_outcome")
      .eq("status", "closed")
      .order("close_time", { ascending: false })
      .limit(50);
    setClosedLoading(false);
    if (error) {
      setResolveError(error.message);
      return;
    }
    setClosedMarkets(data || []);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setGate({ status: "no-user" });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setGate({ status: "no-admin" });
        return;
      }

      setGate(profile?.is_admin ? { status: "ready" } : { status: "no-admin" });
    };

    checkAdmin();
    loadClosedMarkets();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.question.trim()) {
      setError("Question is required.");
      return;
    }
    if (!form.closeTime) {
      setError("Close time is required.");
      return;
    }

    const closeIso = new Date(form.closeTime).toISOString();

    setLoading(true);
    const { error: insertError } = await supabase.from("markets").insert({
      question: form.question.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      close_time: closeIso,
      status: "open",
    });
    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("Market created.");
    setForm(emptyForm);
  };

  const handleGraphMinVotesSave = () => {
    setThresholdMessage(null);
    setThresholdError(null);
    if (Number.isNaN(graphMinVotes) || graphMinVotes < 0) {
      setThresholdError("Minimum votes must be 0 or more.");
      return;
    }
    supabase
      .from("settings")
      .upsert({ key: "graph_min_votes", value: graphMinVotes })
      .then(({ error }) => {
        if (error) {
          const needsTable =
            error.message &&
            error.message.toLowerCase().includes("could not find the table");
          setThresholdError(
            needsTable
              ? "Settings table missing. Create table 'settings' (key text primary key, value jsonb) or ask your admin."
              : error.message
          );
          return;
        }
        setThresholdMessage(`Graph threshold saved (${graphMinVotes} votes).`);
      })
      .catch((err) => {
        setThresholdError(err.message);
      });
  };

  const handleMinVotersSave = () => {
    setMinVotersMessage(null);
    setMinVotersError(null);
    if (Number.isNaN(minVoters) || minVoters < 0) {
      setMinVotersError("Minimum voters must be 0 or more.");
      return;
    }
    supabase
      .from("settings")
      .upsert({ key: "min_voters_scoring", value: minVoters })
      .then(({ error }) => {
        if (error) {
          const needsTable =
            error.message &&
            error.message.toLowerCase().includes("could not find the table");
          setMinVotersError(
            needsTable
              ? "Settings table missing. Create table 'settings' (key text primary key, value jsonb) or ask your admin."
              : error.message
          );
          return;
        }
        setMinVotersMessage(`Scoring minimum updated to ${minVoters} voters.`);
      })
      .catch((err) => {
        setMinVotersError(err.message);
      });
  };

  const handleManualClose = async () => {
    setCloseMessage(null);
    setCloseError(null);
    setCloseLoading(true);
    try {
      const res = await fetch("/api/markets/close-overdue");
      const body = await res.json();
      if (!res.ok) {
        setCloseError(body?.error || "Failed to close markets.");
      } else {
        setCloseMessage(
          typeof body.closed === "number"
            ? `Closed ${body.closed} overdue market${body.closed === 1 ? "" : "s"}.`
            : "Overdue markets processed."
        );
        loadClosedMarkets();
      }
    } catch (err: any) {
      setCloseError(err?.message || "Failed to close markets.");
    } finally {
      setCloseLoading(false);
    }
  };

  const handleResolve = async (marketId: string, outcome: "yes" | "no") => {
    setResolveMessage(null);
    setResolveError(null);
    setResolvingId(marketId);
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResolveError(body?.error || "Failed to resolve market.");
      } else {
        setResolveMessage(`Resolved market ${marketId} with outcome ${outcome}.`);
        loadClosedMarkets();
      }
    } catch (err: any) {
      setResolveError(err?.message || "Failed to resolve market.");
    } finally {
      setResolvingId(null);
    }
  };

  if (gate.status === "loading") {
    return <p className="text-sm text-[var(--color-text-secondary)]">Checking access…</p>;
  }

  if (gate.status === "no-user") {
    return <p className="text-sm text-[var(--color-text-secondary)]">Please log in to access admin tools.</p>;
  }

  if (gate.status === "no-admin") {
    return <p className="field-error">You do not have admin access.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="card card-spaced">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Create new markets. Fields marked required must be filled.
        </p>
      </div>

      <div className="card card-spaced">
        <h2 className="text-sm font-semibold mb-3">Create market</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Question *</label>
            <input
              className="input"
              type="text"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Will X happen by Y?"
              required
            />
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea
              className="input min-h-[90px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="More context for traders (optional)"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="politics">Politics</option>
                <option value="sport">Sport</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="field-label">Close time *</label>
              <input
                className="input"
                type="datetime-local"
                value={form.closeTime}
                onChange={(e) => setForm((f) => ({ ...f, closeTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {error && <p className="alert-error text-xs">{error}</p>}
          {message && (
            <p className="text-xs text-[var(--color-success)]">{message}</p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create market"}
          </button>
        </form>
      </div>

      <div className="card card-spaced">
        <h2 className="text-sm font-semibold mb-3">Graph visibility threshold</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Hide the sentiment graph until enough votes are in. This is saved locally in your browser.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Min votes to show graph</label>
            <input
              className="input"
              type="number"
              min={0}
              value={graphMinVotes}
              onChange={(e) => setGraphMinVotes(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-secondary w-full sm:w-auto"
              onClick={handleGraphMinVotesSave}
            >
              Save threshold
            </button>
          </div>
        </div>
        {thresholdMessage && (
          <p className="mt-2 text-xs text-[var(--color-success)]">{thresholdMessage}</p>
        )}
        {thresholdError && (
          <p className="mt-1 alert-error text-xs">{thresholdError}</p>
        )}
      </div>

      <div className="card card-spaced">
        <h2 className="text-sm font-semibold mb-3">Scoring minimum voters</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Markets with fewer than this many votes will resolve with no points awarded.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Min voters to score</label>
            <input
              className="input"
              type="number"
              min={0}
              value={minVoters}
              onChange={(e) => setMinVoters(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-secondary w-full sm:w-auto"
              onClick={handleMinVotersSave}
            >
              Save min voters
            </button>
          </div>
        </div>
        {minVotersMessage && (
          <p className="mt-2 text-xs text-[var(--color-success)]">{minVotersMessage}</p>
        )}
        {minVotersError && (
          <p className="mt-1 alert-error text-xs">{minVotersError}</p>
        )}
      </div>

      <div className="card card-spaced">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Closed markets</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Resolve closed markets with the correct outcome.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={loadClosedMarkets}
            disabled={closedLoading}
          >
            {closedLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {resolveMessage && (
          <p className="mt-2 text-xs text-[var(--color-success)]">{resolveMessage}</p>
        )}
        {resolveError && (
          <p className="mt-1 alert-error text-xs">{resolveError}</p>
        )}
        <div className="mt-3 space-y-3">
          {closedMarkets.length === 0 && !closedLoading && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              No closed markets to resolve.
            </p>
          )}
          {closedMarkets.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-3 py-2"
            >
              <div className="text-xs">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {m.question}
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  ID: {m.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={resolvingId === m.id}
                  onClick={() => handleResolve(m.id, "yes")}
                >
                  {resolvingId === m.id ? "Resolving..." : "Resolve YES"}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={resolvingId === m.id}
                  onClick={() => handleResolve(m.id, "no")}
                >
                  {resolvingId === m.id ? "Resolving..." : "Resolve NO"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-spaced">
        <h2 className="text-sm font-semibold mb-3">Manual close</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Force-close all markets whose close time has passed (sets status to closed).
        </p>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={closeLoading}
          onClick={handleManualClose}
        >
          {closeLoading ? "Closing..." : "Close overdue markets"}
        </button>
        {closeMessage && (
          <p className="mt-2 text-xs text-[var(--color-success)]">{closeMessage}</p>
        )}
        {closeError && (
          <p className="mt-1 alert-error text-xs">{closeError}</p>
        )}
      </div>
    </div>
  );
}

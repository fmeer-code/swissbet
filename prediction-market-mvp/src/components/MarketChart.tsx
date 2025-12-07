// src/components/MarketChart.tsx
"use client";

type Snapshot = {
  snapshot_time: string;
  yes_pct: number;
  no_pct: number;
};

interface Props {
  snapshots: Snapshot[];
  voteCount: number;
  minVotes?: number;
}

export default function MarketChart({
  snapshots,
  voteCount,
  minVotes = 0,
}: Props) {
  if (voteCount < minVotes) {
    return (
      <p className="text-xs text-[var(--color-text-secondary)]">
        Waiting for more votes to show the graph. ({voteCount}/{minVotes})
      </p>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-secondary)]">
        Not enough data yet.
      </p>
    );
  }

  const width = 300;
  const height = 120;
  const padding = 10;

  const yesPoints = snapshots.map((s, idx) => {
    const x =
      padding +
      ((width - 2 * padding) * idx) / Math.max(1, snapshots.length - 1);
    const y = padding + (height - 2 * padding) * (1 - s.yes_pct / 100);
    return { x, y };
  });

  const pathD = yesPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const latest = snapshots[snapshots.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs">
        <div>
          <span className="text-[var(--color-text-secondary)] mr-1">YES</span>
          <span className="font-semibold">{latest.yes_pct.toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)] mr-1">NO</span>
          <span className="font-semibold">{latest.no_pct.toFixed(0)}%</span>
        </div>
      </div>
      <svg width={width} height={height} className="w-full">
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
        />
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => {
          const y = padding + ((height - 2 * padding) * (100 - pct)) / 100;
          return (
            <line
              key={pct}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 3"
              strokeWidth={0.5}
            />
          );
        })}
        {/* YES line */}
        <path
          d={pathD}
          fill="none"
          stroke="#2b82ff"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Points */}
        {yesPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2}
            fill="#2b82ff"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1}
          />
        ))}
      </svg>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        Line shows YES % over time.
      </p>
    </div>
  );
}

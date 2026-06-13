"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeaderboardEvolutionSeries } from "@/lib/repositories/home-repository";

type Props = {
  series: LeaderboardEvolutionSeries[];
};

type TooltipRow = {
  dataKey: string;
  name: string;
  color: string;
  rank: number;
  points: number;
};

type ChartPoint = {
  snapshotId: number;
  snapshotKey: string;
  label: string;
  createdAt: string;
  tooltipRows: TooltipRow[];
  [key: string]: string | number | null | TooltipRow[];
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: ChartPoint;
  }>;
};

function getPointsKey(index: number) {
  return `points${index}`;
}

function getRankKey(index: number) {
  return `rank${index}`;
}

function buildChartData(series: LeaderboardEvolutionSeries[]) {
  const snapshots = new Map<number, ChartPoint>();

  series.forEach((item, index) => {
    const rankKey = getRankKey(index);
    const pointsKey = getPointsKey(index);

    for (const point of item.points) {
      const existing = snapshots.get(point.snapshotId) ?? {
        snapshotId: point.snapshotId,
        snapshotKey: String(point.snapshotId),
        label: point.label,
        createdAt: point.createdAt,
        tooltipRows: [],
      };

      snapshots.set(point.snapshotId, {
        ...existing,
        [rankKey]: point.rank,
        [pointsKey]: point.totalPoints,
        tooltipRows: [
          ...existing.tooltipRows,
          {
            dataKey: rankKey,
            name: item.name,
            color: item.color,
            rank: point.rank,
            points: point.totalPoints,
          },
        ],
      });
    }
  });

  return Array.from(snapshots.values())
    .map((point) => ({
      ...point,
      tooltipRows: [...point.tooltipRows].sort((a, b) => a.rank - b.rank),
    }))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

function EvolutionTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const activePoint = payload.find((item) => item.payload)?.payload;
  const rows = activePoint?.tooltipRows ?? [];

  if (!activePoint || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-xl">
      <p className="mb-2 font-bold">{activePoint.label}</p>
      <div className="space-y-2">
        {rows.map((item) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold">{item.name}</span>
            <span className="text-black/55">
              #{item.rank} · {item.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardEvolutionChart({ series }: Props) {
  const chartData = useMemo(() => buildChartData(series), [series]);
  const chartLines = series
    .map((item, index) => ({ item, rankKey: getRankKey(index) }))
    .sort(
      (a, b) => Number(a.item.isCurrentUser) - Number(b.item.isCurrentUser),
    );
  const maxRank = useMemo(
    () =>
      series.reduce(
        (max, item) =>
          item.points.reduce(
            (seriesMax, point) => Math.max(seriesMax, point.rank),
            max,
          ),
        1,
      ),
    [series],
  );

  if (chartData.length < 2 || series.every((item) => item.points.length < 2)) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white p-6 text-center shadow-sm">
        <div>
          <p className="text-base font-extrabold text-black">
            Todavía no hay histórico suficiente
          </p>
          <p className="mt-2 text-sm text-black/60">
            La evolución aparecerá cuando existan al menos dos snapshots de la
            clasificación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-3xl border border-black/5 bg-white px-1 pt-3 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
        >
          <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
          <XAxis
            dataKey="snapshotKey"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              chartData.find((point) => point.snapshotKey === String(value))
                ?.label ?? String(value)
            }
            tick={{ fill: "rgba(0,0,0,0.55)", fontSize: 12, fontWeight: 700 }}
          />
          <YAxis
            reversed
            allowDecimals={false}
            width={42}
            domain={[1, Math.max(maxRank, 3)]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `#${Math.trunc(Number(value))}`}
            tick={{ fill: "rgba(0,0,0,0.55)", fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip content={<EvolutionTooltip />} />
          {chartLines.map(({ item, rankKey }) => (
            <Line
              key={item.userId}
              type="monotone"
              dataKey={rankKey}
              name={item.name}
              stroke={item.color}
              strokeWidth={item.isCurrentUser ? 4 : 2}
              dot={{ r: item.isCurrentUser ? 4 : 3, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

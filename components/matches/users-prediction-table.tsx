"use client";

import { loadMatchPredictions } from "@/app/(main)/matches/actions";
import {
  formatNullablePredictionNumber,
  formatPredictionResultLabel,
  formatPredictionScore,
  getMatchPredictionRuleText,
} from "@/lib/format/prediction-breakdown";
import type { MatchPredictionBreakdown, MatchWithPrediction } from "@/types";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type PredictionRow = {
  id: number;
  user_id: string;
  full_name: string | null;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
  breakdown: MatchPredictionBreakdown | null;
  is_calculated: boolean;
};

type Props = {
  match: MatchWithPrediction;
};

export default function UsersPredictionTable({ match }: Props) {
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPredictions() {
      setLoading(true);
      setError(null);

      const result = await loadMatchPredictions(match.id);

      if (ignore) return;

      setViewerUserId(result.viewerUserId);

      if (!result.success) {
        setError(result.error ?? "No se pudieron cargar las predicciones");
        setPredictions([]);
      } else {
        setPredictions((result.data ?? []) as PredictionRow[]);
      }

      setLoading(false);
    }

    void loadPredictions();

    return () => {
      ignore = true;
    };
  }, [match.id]);

  if (loading) {
    return <PredictionsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">No se pudieron cargar las predicciones</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-4">
        <p className="text-sm text-black/60">
          Todavía no hay predicciones para este partido.
        </p>
      </div>
    );
  }

  const calculatedPredictions = predictions.filter(
    (prediction) => prediction.is_calculated,
  );
  const topPoints = calculatedPredictions.reduce<number | null>(
    (maxPoints, prediction) => {
      if (prediction.points == null) return maxPoints;
      if (maxPoints == null) return prediction.points;
      return Math.max(maxPoints, prediction.points);
    },
    null,
  );
  const viewerPrediction = viewerUserId
    ? predictions.find((prediction) => prediction.user_id === viewerUserId)
    : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <PredictionSummaryItem
          label="Predicciones"
          value={String(predictions.length)}
        />
        <PredictionSummaryItem
          label="Mejor puntuación"
          value={topPoints == null ? "Sin calcular" : `${topPoints} pts`}
        />
        <PredictionSummaryItem
          label="Tu predicción"
          value={
            viewerPrediction
              ? formatPredictionScore(
                  viewerPrediction.predicted_home_score,
                  viewerPrediction.predicted_away_score,
                )
              : "Sin pred."
          }
          highlighted
        />
      </div>

      <div className="grid items-start gap-2 sm:grid-cols-2">
        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.id}
            matchStatus={match.status}
            prediction={prediction}
            isViewerPrediction={viewerUserId === prediction.user_id}
          />
        ))}
      </div>
    </div>
  );
}

function PredictionSummaryItem({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 shadow-sm ${
        highlighted
          ? "border-[#2A398D]/15 bg-[#2A398D]/5"
          : "border-black/5 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-black">{value}</p>
    </div>
  );
}

function PredictionCard({
  matchStatus,
  prediction,
  isViewerPrediction,
}: {
  matchStatus: string;
  prediction: PredictionRow;
  isViewerPrediction: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasBreakdown = Boolean(prediction.breakdown);
  const ruleText = getMatchPredictionRuleText(prediction.breakdown?.ruleKey);

  return (
    <article
      className={`self-start overflow-hidden rounded-2xl border shadow-sm ${
        isViewerPrediction
          ? "border-[#2A398D]/25 bg-[#2A398D]/5"
          : "border-black/10 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (hasBreakdown) setOpen((prev) => !prev);
        }}
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5 text-left transition ${
          hasBreakdown ? "cursor-pointer hover:bg-black/2.5" : "cursor-default"
        }`}
      >
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-extrabold text-black">
              {prediction.full_name || "Usuario sin nombre"}
            </span>

            {isViewerPrediction && (
              <span className="shrink-0 rounded-full bg-[#2A398D] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                Tú
              </span>
            )}
          </span>

          <span className="mt-0.5 block truncate text-[11px] font-medium text-black/45">
            {hasBreakdown ? ruleText : getPendingText(matchStatus)}
          </span>
        </span>

        <span className="rounded-xl border border-black/5 bg-white px-2.5 py-1 text-base font-extrabold text-black/85 shadow-sm">
          {prediction.predicted_home_score} - {prediction.predicted_away_score}
        </span>

        <span className="flex items-center justify-end gap-1.5">
          <PredictionPoints prediction={prediction} />

          {hasBreakdown ? (
            open ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-[#1D4ED8]" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-[#1D4ED8]" />
            )
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}
        </span>
      </button>

      {open && prediction.breakdown && (
        <div className="border-t border-black/10 bg-black/2 px-3 py-3">
          <PredictionBreakdown breakdown={prediction.breakdown} />
        </div>
      )}
    </article>
  );
}

function PredictionPoints({ prediction }: { prediction: PredictionRow }) {
  if (!prediction.is_calculated) {
    return (
      <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold tracking-wide text-black/45 uppercase">
        Pendiente
      </span>
    );
  }

  return (
    <span className="rounded-full bg-[#1D4ED8]/10 px-2.5 py-1 text-xs font-extrabold text-[#1D4ED8]">
      {prediction.points ?? 0} pts
    </span>
  );
}

function PredictionBreakdown({
  breakdown,
}: {
  breakdown: MatchPredictionBreakdown;
}) {
  return (
    <div className="grid gap-2 text-sm text-black/70 sm:grid-cols-2">
      <BreakdownItem
        label="Regla"
        value={getMatchPredictionRuleText(breakdown.ruleKey)}
      />
      <BreakdownItem label="Puntos" value={String(breakdown.points)} />
      <BreakdownItem
        label="Resultado real"
        value={formatPredictionResultLabel(breakdown.realResult)}
      />
      <BreakdownItem
        label="Resultado predicho"
        value={formatPredictionResultLabel(breakdown.predictedResult)}
      />
      <BreakdownItem
        label="Marcador real"
        value={formatPredictionScore(
          breakdown.realHomeScore,
          breakdown.realAwayScore,
        )}
      />
      <BreakdownItem
        label="Marcador predicho"
        value={formatPredictionScore(
          breakdown.predictedHomeScore,
          breakdown.predictedAwayScore,
        )}
      />
      <BreakdownItem
        label="Diferencia real"
        value={formatNullablePredictionNumber(breakdown.realDifference)}
      />
      <BreakdownItem
        label="Diferencia predicha"
        value={formatNullablePredictionNumber(breakdown.predictedDifference)}
      />
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-black">{value}</p>
    </div>
  );
}

function getPendingText(status: string): string {
  if (status === "live") return "Partido en juego, pendiente de cálculo";
  if (status === "completed") return "Pendiente de cálculo";
  return "Predicción visible";
}

function PredictionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-black/5" />
            <div className="mt-2 h-4 w-16 animate-pulse rounded bg-black/5" />
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <div className="h-4 w-28 animate-pulse rounded bg-black/5" />
                <div className="mt-1 h-3 w-24 animate-pulse rounded bg-black/5" />
              </div>

              <div className="h-7 w-12 animate-pulse rounded-xl bg-black/5" />
              <LoaderCircle className="h-4 w-4 animate-spin text-black/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

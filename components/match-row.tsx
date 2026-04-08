"use client";

import { MatchWithPrediction } from "@/types";
import Image from "next/image";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

type MatchRowProps = {
  match: MatchWithPrediction;
  onViewPredictions?: (matchId: number) => void;
  onMakePrediction?: (
    matchId: number,
    kickoffAt: string,
    matchPredictedHomeScore: number | null,
    matchPredictedAwayScore: number | null,
    predictedHomeScore: number,
    predictedAwayScore: number,
  ) => Promise<{ saved: boolean; errorMessage: string | null }>;
};

function parseUtcDate(dateString: string) {
  return new Date(dateString.replace(" ", "T"));
}

function formatKickoffDateTime(dateString: string) {
  const date = parseUtcDate(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getPredictionCloseDate(kickoffAt: string) {
  const kickoffDate = parseUtcDate(kickoffAt);
  return new Date(kickoffDate.getTime() - 60 * 1000);
}

function isPredictionClosed(kickoffAt: string) {
  return new Date() >= getPredictionCloseDate(kickoffAt);
}

function getRoundLabel(round: string) {
  switch (round) {
    case "group":
      return "GRUPOS";
    case "R32":
      return "DIECISEISAVOS";
    case "R16":
      return "OCTAVOS";
    case "QF":
      return "CUARTOS DE FINAL";
    case "SF":
      return "SEMIFINALES";
    case "3r":
      return "3/4 PUESTO";
    case "final":
      return "FINAL";
    default:
      return round.toUpperCase();
  }
}

export default function MatchRow({
  match,
  onViewPredictions,
  onMakePrediction,
}: MatchRowProps) {
  const [predictedHomeScore, setPredictedHomeScore] = useState<number>(
    match.predicted_home_score ?? 0,
  );
  const [predictedAwayScore, setPredictedAwayScore] = useState<number>(
    match.predicted_away_score ?? 0,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const kickoffDateTime = formatKickoffDateTime(match.kickoff_at);
  const predictionClosed = isPredictionClosed(match.kickoff_at);
  const hasScore = match.home_score !== null && match.away_score !== null;
  const hasPrediction =
    match.predicted_home_score !== null && match.predicted_away_score !== null;

  const showClosedBadge =
    predictionClosed && match.status !== "completed" && match.status !== "live";

  const canMakePrediction = match.status === "scheduled" && !predictionClosed;
  const canViewPredictions = match.status !== "scheduled" || predictionClosed;

  const selectClassName = `w-14 rounded-md p-2 text-center font-semibold text-white ${
    hasPrediction
      ? "bg-green-700 disabled:bg-green-700/50"
      : "bg-blue-900 disabled:bg-blue-900/50"
  }`;

  const predictionButtonClassName = `cursor-pointer w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
    hasPrediction
      ? "bg-green-700 hover:bg-green-800"
      : "bg-[#2A398D] hover:bg-[#22307c]"
  }`;

  async function handleSubmitPrediction() {
    if (!onMakePrediction || isSaving || predictionClosed) return;

    setIsSaving(true);
    setSaveError(null);

    const res = await onMakePrediction(
      match.id,
      match.kickoff_at,
      match.predicted_home_score,
      match.predicted_away_score,
      predictedHomeScore,
      predictedAwayScore,
    );

    if (res.errorMessage) {
      setSaveError(res.errorMessage);
    }

    setIsSaving(false);
  }

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            {getRoundLabel(match.round)}
            {match.round === "group" &&
              match.group_name &&
              ` (${match.group_name})`}
          </span>

          {showClosedBadge && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-700">
              CERRADO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-black">{kickoffDateTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
            <Image
              src={`https://flagcdn.com/w160/${match.home_team_flag_code}.png`}
              alt={`Bandera de ${match.home_team_name}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
              title={match.home_team_name}
            />
          </div>

          <span
            className="text-lg font-extrabold tracking-wide text-black"
            title={match.home_team_name}
          >
            {match.home_team_code}
          </span>
        </div>

        <div className="flex min-w-27.5 flex-col items-center justify-center gap-2">
          <div className="flex gap-2">
            <select
              value={predictedHomeScore}
              className={selectClassName}
              disabled={!canMakePrediction || isSaving}
              onChange={(e) => setPredictedHomeScore(Number(e.target.value))}
            >
              {Array.from({ length: 11 }).map((_, index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>

            <span className="text-4xl text-black/70">-</span>

            <select
              value={predictedAwayScore}
              className={selectClassName}
              disabled={!canMakePrediction || isSaving}
              onChange={(e) => setPredictedAwayScore(Number(e.target.value))}
            >
              {Array.from({ length: 11 }).map((_, index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>
          </div>

          {hasScore ? (
            <p className="mb-2 text-center text-[14px] leading-4 font-semibold text-black">
              FT: {match.home_score} - {match.away_score}
            </p>
          ) : (
            <p className="mb-2 text-center text-[11px] leading-4 text-black/45">
              {match.stadium_city}, {match.stadium_country}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="overflow-hidden rounded-tl-xl rounded-br-xl border border-black/5 bg-white shadow-sm">
            <Image
              src={`https://flagcdn.com/w160/${match.away_team_flag_code}.png`}
              alt={`Bandera de ${match.away_team_name}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
              title={match.away_team_name}
            />
          </div>

          <span
            className="text-lg font-extrabold tracking-wide text-black"
            title={match.away_team_name}
          >
            {match.away_team_code}
          </span>
        </div>
      </div>

      {saveError && (
        <div className="mt-3">
          <p className="text-sm font-medium text-red-600">{saveError}</p>
        </div>
      )}

      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewPredictions?.(match.id)}
          className="w-full rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#2A398D] transition hover:bg-[#2A398D]/5"
          hidden={!canViewPredictions}
        >
          VER PREDICCIONES
        </button>

        <button
          type="button"
          onClick={handleSubmitPrediction}
          disabled={isSaving}
          className={predictionButtonClassName}
          hidden={!canMakePrediction}
        >
          {isSaving ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              GUARDANDO...
            </span>
          ) : hasPrediction ? (
            "EDITAR PREDICCIÓN"
          ) : (
            "HACER PREDICCIÓN"
          )}
        </button>
      </div>
    </article>
  );
}

"use client";

import { MatchWithPrediction } from "@/types";
import Image from "next/image";
import { useState } from "react";
import { Clock, LoaderCircle } from "lucide-react";
import Swal from "sweetalert2";
import {
  formatKickoffDateTime,
  getRoundLabel,
  isPredictionClosed,
} from "@/lib/format/match";

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
  const homeTeamName = match.home_team_name ?? "Equipo local";
  const homeTeamCode = match.home_team_code ?? "LOC";
  const homeTeamFlagCode = match.home_team_flag_code ?? "un";
  const awayTeamName = match.away_team_name ?? "Equipo visitante";
  const awayTeamCode = match.away_team_code ?? "VIS";
  const awayTeamFlagCode = match.away_team_flag_code ?? "un";

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
      void Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: `No se ha guardado la predicción: ${res.errorMessage}`,
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        showCloseButton: true,
        width: 500,
      });
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
          {match.prediction_points ? (
            <p className="rounded-full bg-green-800/70 px-3 py-1 text-center text-[11px] tracking-wide">
              +{match.prediction_points} pts
            </p>
          ) : match.status === "completed" || match.status === "live" ? (
            <p
              title="Los puntos para este partido todavía no se han calculado"
              className="inline-flex cursor-help items-center gap-1 rounded-full bg-yellow-600/80 px-3 py-1 text-center text-[11px] tracking-wide"
            >
              <Clock className="h-3 w-3" />
              NO CALC.
            </p>
          ) : (
            <></>
          )}
          <p className="text-sm font-bold text-black">{kickoffDateTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
            <Image
              src={`https://flagcdn.com/w160/${homeTeamFlagCode}.png`}
              alt={`Bandera de ${homeTeamName}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
              title={homeTeamName}
            />
          </div>

          <span
            className="text-lg font-extrabold tracking-wide text-black"
            title={homeTeamName}
          >
            {homeTeamCode}
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
              src={`https://flagcdn.com/w160/${awayTeamFlagCode}.png`}
              alt={`Bandera de ${awayTeamName}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
              title={awayTeamName}
            />
          </div>

          <span
            className="text-lg font-extrabold tracking-wide text-black"
            title={awayTeamName}
          >
            {awayTeamCode}
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
          className="w-full cursor-pointer rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#2A398D] transition hover:bg-[#2A398D]/15"
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

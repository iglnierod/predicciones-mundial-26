"use client";

import { Match } from "@/types";
import Image from "next/image";

type MatchRowProps = {
  match: Match;
  onViewPredictions?: (matchId: number) => void;
  onMakePrediction?: (matchId: number) => void;
};

function formatKickoffDateTime(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
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
  const kickoffDateTime = formatKickoffDateTime(match.kickoff_at);

  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            {getRoundLabel(match.round)}
          </span>

          {match.round === "group" && match.group_name && (
            <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
              GRUPO {match.group_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-800/70 px-3 py-1 text-[12px] font-bold tracking-wide text-white/70">
            +8 pts
          </span>
          <p className="text-sm font-bold text-black">{kickoffDateTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
            <Image
              src={
                match.home_team_flag_code
                  ? `https://flagcdn.com/w160/${match.home_team_flag_code}.png`
                  : "/unknown.png"
              }
              alt={`Bandera de ${match.home_team_name}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
            />
          </div>

          <span className="text-lg font-extrabold tracking-wide text-black">
            {match.home_team_code}
          </span>
        </div>

        <div className="flex min-w-27.5 flex-col items-center justify-center gap-2">
          <div className="flex gap-2">
            <select
              className="w-14 rounded-md bg-blue-900 p-2 text-center font-semibold text-white disabled:bg-blue-900/50"
              disabled={match.status !== "scheduled"}
            >
              <option className="rounded">0</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
            </select>
            <span className="text-4xl text-black/70">-</span>
            <select
              className="w-14 rounded-md bg-blue-900 p-2 text-center font-semibold text-white disabled:bg-blue-900/50"
              disabled={match.status !== "scheduled"}
            >
              <option className="rounded">0</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
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
              src={
                match.away_team_flag_code
                  ? `https://flagcdn.com/w160/${match.away_team_flag_code}.png`
                  : "/unknown.png"
              }
              alt={`Bandera de ${match.away_team_name}`}
              width={72}
              height={48}
              className="h-12 w-18 object-cover"
            />
          </div>

          <span className="text-lg font-extrabold tracking-wide text-black">
            {match.away_team_code}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewPredictions?.(match.id)}
          className="w-full rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#2A398D] transition hover:bg-[#2A398D]/5"
          hidden={match.status === "scheduled"}
        >
          VER PREDICCIONES
        </button>

        <button
          type="button"
          onClick={() => onMakePrediction?.(match.id)}
          className="w-full rounded-2xl bg-[#2A398D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22307c]"
          hidden={match.status !== "scheduled"}
        >
          HACER PREDICCIÓN
        </button>
      </div>
    </article>
  );
}

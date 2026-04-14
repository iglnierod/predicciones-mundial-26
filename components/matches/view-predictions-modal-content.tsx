"use client";

import Image from "next/image";
import { MatchWithPrediction } from "@/types";
import UsersPredictionTable from "./users-prediction-table";

type Props = {
  match: MatchWithPrediction;
};

function parseUtcDate(dateString: string) {
  return new Date(dateString.replace(" ", "T"));
}

function formatKickoffDateTime(dateString: string) {
  const date = parseUtcDate(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export default function ViewPredictionsModalContent({ match }: Props) {
  const kickoffDateTime = formatKickoffDateTime(match.kickoff_at);
  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <div className="text-left">
      <div className="mb-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            {getRoundLabel(match.round)}
            {match.round === "group" && match.group_name
              ? ` (${match.group_name})`
              : ""}
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {kickoffDateTime}
          </span>
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
              />
            </div>

            <p className="text-sm font-extrabold text-black">
              {match.home_team_name}
            </p>

            <p className="text-xs text-black/60">{match.home_team_code}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-3xl font-extrabold text-black/80">
              {hasScore ? `${match.home_score} - ${match.away_score}` : "VS"}
            </div>

            <p className="text-center text-xs text-black/50">
              {match.stadium_city}, {match.stadium_country}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="overflow-hidden rounded-tl-xl rounded-br-xl border border-black/5 bg-white shadow-sm">
              <Image
                src={`https://flagcdn.com/w160/${match.away_team_flag_code}.png`}
                alt={`Bandera de ${match.away_team_name}`}
                width={72}
                height={48}
                className="h-12 w-18 object-cover"
              />
            </div>

            <p className="text-sm font-extrabold text-black">
              {match.away_team_name}
            </p>

            <p className="text-xs text-black/60">{match.away_team_code}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-black/10 bg-black/[0.03] p-4">
        <UsersPredictionTable matchId={match.id} />
      </div>
    </div>
  );
}

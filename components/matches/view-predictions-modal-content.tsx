"use client";

import Image from "next/image";
import { MatchWithPrediction } from "@/types";
import UsersPredictionTable from "./users-prediction-table";
import { formatKickoffDateTime, getRoundLabel } from "@/lib/format/match";

type Props = {
  match: MatchWithPrediction;
};

export default function ViewPredictionsModalContent({ match }: Props) {
  const kickoffDateTime = formatKickoffDateTime(match.kickoff_at, {
    year: "numeric",
  });
  const hasScore = match.home_score !== null && match.away_score !== null;
  const homeTeamName = match.home_team_name ?? "Equipo local";
  const homeTeamCode = match.home_team_code ?? "LOC";
  const homeTeamFlagCode = match.home_team_flag_code ?? "un";
  const awayTeamName = match.away_team_name ?? "Equipo visitante";
  const awayTeamCode = match.away_team_code ?? "VIS";
  const awayTeamFlagCode = match.away_team_flag_code ?? "un";

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
                src={`https://flagcdn.com/w160/${homeTeamFlagCode}.png`}
                alt={`Bandera de ${homeTeamName}`}
                width={72}
                height={48}
                className="h-12 w-18 object-cover"
              />
            </div>

            <p className="text-sm font-extrabold text-black">{homeTeamName}</p>

            <p className="text-xs text-black/60">{homeTeamCode}</p>
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
                src={`https://flagcdn.com/w160/${awayTeamFlagCode}.png`}
                alt={`Bandera de ${awayTeamName}`}
                width={72}
                height={48}
                className="h-12 w-18 object-cover"
              />
            </div>

            <p className="text-sm font-extrabold text-black">{awayTeamName}</p>

            <p className="text-xs text-black/60">{awayTeamCode}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-black/10 bg-black/3 p-4">
        <UsersPredictionTable match={match} />
      </div>
    </div>
  );
}

"use client";

import { LeaderboardProfile } from "@/types";
import Image from "next/image";
import { UserBreakdownModal } from "./user-breakdown-modal";

type Props = {
  leaderboard: LeaderboardProfile[];
  userId?: string;
};

const USER_NAME_MAX_LENGTH = 20;

function truncateName(name: string) {
  const characters = Array.from(name);

  if (characters.length <= USER_NAME_MAX_LENGTH) {
    return name;
  }

  return `${characters.slice(0, USER_NAME_MAX_LENGTH - 3).join("")}...`;
}

export default function LeaderboardTable({ leaderboard, userId }: Props) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-700";
    if (rank === 2) return "text-slate-600";
    if (rank === 3) return "text-orange-700";
    return "text-black/70";
  };

  const getMovement = (rankChange: number | null) => {
    if (rankChange === null || rankChange === 0) {
      return {
        label: "-",
        className: "text-yellow-700",
      };
    }

    if (rankChange > 0) {
      return {
        label: `↑ ${rankChange}`,
        className: "text-emerald-700",
      };
    }

    return {
      label: `↓ ${Math.abs(rankChange)}`,
      className: "text-red-700",
    };
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/30 backdrop-blur-sm">
      <table className="w-full border-collapse text-black">
        <thead>
          <tr className="border-b border-black/10 bg-black/5 text-sm tracking-wide text-black/60 uppercase">
            <th className="px-4 py-4 text-left font-semibold sm:px-6">
              Posición
            </th>
            <th className="px-4 py-4 text-left font-semibold sm:px-6">
              Usuario
            </th>
            <th className="px-4 py-4 text-right font-semibold sm:px-6">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {leaderboard?.map((user) => {
            const isCurrentUser = userId === user.user_id;
            const movement = getMovement(user.rank_change);
            const displayName = user.full_name ?? "Usuario sin nombre";
            const pointBreakdown = [
              ...(user.tournament_points > 0
                ? [`Globales: ${user.tournament_points}`]
                : []),
              ...(user.group_points > 0 ? [`Grupos: ${user.group_points}`] : []),
              `Partidos: ${user.match_points}`,
            ];

            const trClass = isCurrentUser
              ? "cursor-pointer border-b border-black/5 bg-blue-900/15 transition last:border-b-0 hover:bg-blue-900/20"
              : "cursor-pointer border-b border-black/5 transition last:border-b-0 hover:bg-black/5";

            return (
              <tr
                key={user.user_id}
                className={trClass}
                onClick={() =>
                  UserBreakdownModal({
                    profile: user,
                    viewerUserId: userId,
                  })
                }
              >
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex min-w-12 items-center text-xl font-extrabold sm:text-2xl ${getRankStyle(
                        user.rank,
                      )}`}
                    >
                      #{user.rank}
                    </span>
                    <span
                      className={`text-sm font-extrabold ${movement.className}`}
                    >
                      {movement.label}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="hidden overflow-hidden rounded-full border border-black/5 md:block">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={displayName}
                          width={44}
                          height={44}
                          className="h-11 w-11 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center bg-black/5 text-sm font-bold text-black/50">
                          {user.full_name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="whitespace-nowrap text-sm font-semibold text-black sm:text-base"
                        title={displayName}
                      >
                        <span className="sm:hidden">
                          {truncateName(displayName)}
                        </span>
                        <span className="hidden sm:inline">{displayName}</span>
                      </p>
                      <p className="text-xs text-black/50">
                        {pointBreakdown.join(" · ")}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-right sm:px-6">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-extrabold text-[#2A398D]">
                      {user.total_points}
                    </span>
                    <span className="text-xs text-black/45">puntos</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

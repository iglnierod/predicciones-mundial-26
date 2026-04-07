import { Leaderboard } from "@/types";
import Image from "next/image";

type Props = {
  leaderboard: Leaderboard[];
  userId?: string;
};

export default function LeaderboardTable({ leaderboard, userId }: Props) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-400/20 text-yellow-700";
    if (rank === 2) return "bg-gray-700/60 text-gray-300";
    if (rank === 3) return "bg-orange-300/30 text-orange-700";
    return "bg-black/5 text-black/70";
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/30 backdrop-blur-sm">
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
            let trClass;
            if (userId === user.user_id) {
              trClass =
                "bg-blue-900/15 border-b border-black/5 transition last:border-b-0 hover:bg-blue-900/20";
            } else {
              trClass =
                "border-b border-black/5 transition last:border-b-0 hover:bg-black/5";
            }
            return (
              <tr key={user.user_id} className={trClass}>
                <td className="px-4 py-4 sm:px-6">
                  <span
                    className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-1 font-bold ${getRankStyle(
                      user.rank,
                    )}`}
                  >
                    #{user.rank}
                  </span>
                </td>

                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="hidden overflow-hidden rounded-full border border-black/5 md:block">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name ?? "Usuario"}
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
                      <p className="truncate text-sm font-semibold text-black sm:text-base">
                        {user.full_name ?? "Usuario sin nombre"}
                      </p>
                      <p className="text-xs text-black/50">
                        Grupos: {user.group_points} · Partidos:{" "}
                        {user.match_points} · Extras: {user.extra_points}
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

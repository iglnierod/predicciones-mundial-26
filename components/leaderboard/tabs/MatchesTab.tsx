"use client";

import { LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
};

export default function MatchesTab({ profile }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            PARTIDOS
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {profile.match_points} puntos
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Desglose por partidos
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Aquí podrás mostrar más adelante todos los partidos del usuario, sus
          predicciones, puntos ganados y el breakdown detallado de cada uno.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-black/10 bg-black/3 p-4">
        <p className="text-sm text-black/55">
          Ideal para renderizar una lista o tabla con filtros por ronda.
        </p>
      </div>
    </div>
  );
}

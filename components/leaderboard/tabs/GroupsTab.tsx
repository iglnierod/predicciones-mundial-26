"use client";

import { LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
};

export default function GroupsTab({ profile }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            FASE DE GRUPOS
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {profile.group_points} puntos
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Desglose de grupos
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Esta pestaña servirá para mostrar los grupos del usuario, sus
          predicciones, aciertos por grupo y los puntos obtenidos en cada uno.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-black/10 bg-black/3 p-4">
        <p className="text-sm text-black/55">
          Aquí podrás renderizar cards o una tabla con detalle por grupo.
        </p>
      </div>
    </div>
  );
}

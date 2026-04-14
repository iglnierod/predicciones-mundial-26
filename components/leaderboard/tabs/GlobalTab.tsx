"use client";

import { LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
};

export default function GlobalTab({ profile }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Puntos totales" value={profile.total_points} />
        <StatCard label="Grupos" value={profile.group_points} />
        <StatCard label="Partidos" value={profile.match_points} />
        <StatCard label="Extras" value={profile.extra_points} />
      </div>

      <section className="rounded-3xl border border-dashed border-black/10 bg-black/3 p-4">
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-extrabold text-black">
            Resumen general
          </h3>
          <p className="text-sm leading-6 text-black/65">
            Aquí podrás mostrar el desglose global del usuario: predicciones del
            torneo, bonus especiales, estadísticas generales y cualquier resumen
            agregado de sus aciertos.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <p className="text-sm font-medium text-black/55">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#2A398D]">
        {value ?? "-"}
      </p>
    </article>
  );
}

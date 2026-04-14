"use client";

import { LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
  isOwnProfile: boolean;
};

export default function CompareTab({
  profile,
  viewerUserId,
  isOwnProfile,
}: Props) {
  if (!viewerUserId) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-extrabold text-black">Comparar</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">
          Debes iniciar sesión para poder comparar este perfil con el tuyo.
        </p>
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-extrabold text-black">Comparar</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">
          Estás viendo tu propio perfil, así que aquí no hay comparación que
          mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            COMPARACIÓN DIRECTA
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Tú vs {profile.full_name ?? "usuario"}
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Aquí podrás comparar tus resultados con los de este usuario en
          globales, grupos, partidos y extras.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ComparePlaceholderCard title="Global" />
        <ComparePlaceholderCard title="Grupos" />
        <ComparePlaceholderCard title="Partidos" />
      </div>
    </div>
  );
}

function ComparePlaceholderCard({ title }: { title: string }) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <p className="text-sm font-medium text-black/55">{title}</p>
      <p className="mt-2 text-lg font-extrabold text-[#2A398D]">Pendiente</p>
    </article>
  );
}

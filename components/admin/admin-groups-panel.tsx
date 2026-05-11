import { UsersRound } from "lucide-react";

export default function AdminGroupsPanel() {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            GRUPOS
          </span>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-black">
            Gestión de grupos
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Aquí podrás administrar clasificaciones, resultados de fase de
            grupos y cálculos relacionados.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-[#2A398D]/10 p-3 text-[#2A398D] sm:block">
          <UsersRound className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[#2A398D]/20 bg-white p-6 text-sm font-semibold text-black/45">
        Panel de grupos pendiente de implementar.
      </div>
    </article>
  );
}

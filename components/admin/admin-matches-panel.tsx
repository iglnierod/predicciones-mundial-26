"use client";

import { LoaderCircle, Calculator, AlertTriangle } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function AdminMatchesPanel() {
  const [isCalculating, setIsCalculating] = useState(false);

  async function handleCalculatePrediction(matchId: number) {
    if (isCalculating) return;

    setIsCalculating(true);

    try {
      const response = await fetch(
        `/api/admin/matches/${matchId}/calculate-points`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ force: true }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudieron calcular los puntos");
      }

      console.log(data);

      await Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Puntos calculados correctamente",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        showCloseButton: true,
        width: 420,
      });
    } catch (error) {
      console.error(error);

      await Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title:
          error instanceof Error
            ? error.message
            : "Error inesperado al calcular los puntos",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        showCloseButton: true,
        width: 500,
      });
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)] lg:col-span-2">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
              PARTIDOS
            </span>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-black">
              Gestión de partidos
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Desde aquí podrás actualizar resultados, cambiar estados de
              partidos y recalcular los puntos de las predicciones.
            </p>
          </div>

          <div className="hidden rounded-2xl bg-[#2A398D]/10 p-3 text-[#2A398D] sm:block">
            <Calculator className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#2A398D]/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-black">
                Recalcular puntos de partido
              </h3>

              <p className="mt-1 text-sm leading-5 text-black/50">
                Acción temporal para probar el cálculo de puntos de un partido
                concreto.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCalculatePrediction(218)}
              disabled={isCalculating}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2A398D] px-5 py-3 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-[#2A398D]/45"
            >
              {isCalculating ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  CALCULANDO...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  CALCULAR KOR - CZA
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />

          <h3 className="text-base font-extrabold text-black">Pendiente</h3>
        </div>

        <p className="text-sm leading-6 text-black/55">
          Este panel debería evolucionar hacia una tabla de partidos con filtros
          por estado, ronda y botón individual para calcular puntos.
        </p>
      </article>
    </div>
  );
}

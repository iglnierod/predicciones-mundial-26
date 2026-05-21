"use client";

import { MatchWithDetails } from "@/types";
import Image from "next/image";
import {
  ArrowDownUp,
  Calculator,
  DownloadCloud,
  Eye,
  RefreshCw,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  formatKickoffDateTime,
  getMatchStatusLabel,
  getRoundLabel,
  parseUtcDate,
} from "@/lib/format/match";
import type { MatchPredictionBreakdown } from "@/types";

type Props = {
  initialMatches: MatchWithDetails[];
};

type SortKey =
  | "kickoff_at"
  | "status"
  | "points_calculated_at"
  | "match_number";

const PAGE_SIZE = 5;

const MySwal = withReactContent(Swal);

type MatchPointsBreakdownPrediction = {
  id: number;
  user_id: string;
  full_name: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
  is_calculated: boolean;
  breakdown: MatchPredictionBreakdown | null;
};

const tableColumns = [
  {
    key: "match",
    name: "PARTIDO",
    className: "w-[28%] text-left",
  },
  {
    key: "date",
    name: "FECHA",
    className: "w-[15%] text-center",
  },
  {
    key: "status",
    name: "ESTADO",
    className: "w-[13%] text-center",
  },
  {
    key: "score",
    name: "RESULTADO",
    className: "w-[12%] text-center",
  },
  {
    key: "points",
    name: "PUNTOS",
    className: "w-[14%] text-center",
  },
  {
    key: "actions",
    name: "ACCIONES",
    className: "w-[18%] text-right",
  },
];

async function showToast(
  icon: "success" | "error",
  title: string,
  text?: string,
) {
  await Swal.fire({
    toast: true,
    position: "bottom-end",
    icon,
    title,
    text: text || undefined,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    showCloseButton: true,
    width: 420,
  });
}

function isPlayedAndCalculated(match: MatchWithDetails) {
  return match.status === "completed" && Boolean(match.points_calculated_at);
}

export default function AdminMatchesPanel({ initialMatches }: Props) {
  const router = useRouter();

  const [sortKey, setSortKey] = useState<SortKey>("kickoff_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [hidePlayedAndCalculated, setHidePlayedAndCalculated] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isUpdatingAllMatches, setIsUpdatingAllMatches] = useState(false);
  const [isCalculatingPlayedMatches, setIsCalculatingPlayedMatches] =
    useState(false);

  const [fetchingMatchId, setFetchingMatchId] = useState<number | null>(null);
  const [scoringMatchId, setScoringMatchId] = useState<number | null>(null);
  const [viewingBreakdownMatchId, setViewingBreakdownMatchId] = useState<
    number | null
  >(null);

  const [resettingMatchId, setResettingMatchId] = useState<number | null>(null);

  const isBusy =
    isUpdatingAllMatches ||
    isCalculatingPlayedMatches ||
    fetchingMatchId !== null ||
    scoringMatchId !== null ||
    viewingBreakdownMatchId !== null ||
    resettingMatchId !== null;

  const filteredAndSortedMatches = useMemo(() => {
    const filteredMatches = initialMatches.filter((match) => {
      if (!hidePlayedAndCalculated) return true;

      return !isPlayedAndCalculated(match);
    });

    return filteredMatches.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortKey === "kickoff_at") {
        aValue = parseUtcDate(a.kickoff_at).getTime();
        bValue = parseUtcDate(b.kickoff_at).getTime();
      }

      if (sortKey === "status") {
        aValue = a.status;
        bValue = b.status;
      }

      if (sortKey === "match_number") {
        aValue = a.match_number ?? 0;
        bValue = b.match_number ?? 0;
      }

      if (sortKey === "points_calculated_at") {
        aValue = a.points_calculated_at ? 1 : 0;
        bValue = b.points_calculated_at ? 1 : 0;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [hidePlayedAndCalculated, initialMatches, sortDirection, sortKey]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedMatches.length / PAGE_SIZE),
  );

  const paginatedMatches = useMemo(() => {
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return filteredAndSortedMatches.slice(start, end);
  }, [currentPage, filteredAndSortedMatches, totalPages]);

  function handleSortChange(nextSortKey: SortKey) {
    setCurrentPage(1);

    if (nextSortKey === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function handleHidePlayedAndCalculatedChange(checked: boolean) {
    setHidePlayedAndCalculated(checked);
    setCurrentPage(1);
  }

  async function handleUpdateAllMatches() {
    if (isBusy) return;

    setIsUpdatingAllMatches(true);

    try {
      const response = await fetch("/api/admin/matches/fetch", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ?? "No se pudieron actualizar los partidos",
        );
      }

      await showToast(
        "success",
        "Partidos actualizados",
        `${data.result.insertedOrUpdated} partidos insertados o actualizados`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al actualizar partidos",
      );
    } finally {
      setIsUpdatingAllMatches(false);
    }
  }

  async function handleCalculatePlayedMatches() {
    if (isBusy) return;

    setIsCalculatingPlayedMatches(true);

    try {
      const response = await fetch("/api/admin/matches/calculate-played", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ?? "No se pudieron calcular los partidos jugados",
        );
      }

      await showToast(
        "success",
        "Partidos jugados calculados",
        `${data.result.calculatedMatches} calculados · ${data.result.failedMatches} errores`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al calcular partidos jugados",
      );
    } finally {
      setIsCalculatingPlayedMatches(false);
    }
  }

  async function handleFetchMatch(match: MatchWithDetails) {
    if (isBusy) return;

    setFetchingMatchId(match.id);

    try {
      const response = await fetch(`/api/admin/matches/${match.id}/fetch`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudo actualizar el partido");
      }

      await showToast(
        "success",
        "Partido actualizado",
        `${match.home_team_code ?? "-"} - ${match.away_team_code ?? "-"}`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al actualizar el partido",
      );
    } finally {
      setFetchingMatchId(null);
    }
  }

  async function handleCalculateMatchPoints(match: MatchWithDetails) {
    if (isBusy) return;

    setScoringMatchId(match.id);

    try {
      const response = await fetch(
        `/api/admin/matches/${match.id}/calculate-points`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ force: false }),
        },
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron calcular los puntos");
      }

      await showToast(
        "success",
        "Partido puntuado",
        `${match.home_team_code ?? "-"} - ${match.away_team_code ?? "-"}`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al calcular puntos",
      );
    } finally {
      setScoringMatchId(null);
    }
  }

  async function handleShowMatchPointsBreakdown(match: MatchWithDetails) {
    if (isBusy) return;

    setViewingBreakdownMatchId(match.id);

    try {
      const response = await fetch(
        `/api/admin/matches/${match.id}/points-breakdown`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudo cargar el desglose");
      }

      const predictions = (data.predictions ??
        []) as MatchPointsBreakdownPrediction[];

      await MySwal.fire({
        title: `${match.home_team_code ?? "-"} - ${match.away_team_code ?? "-"}`,
        html: <MatchPointsBreakdownModal predictions={predictions} />,
        width: "min(1100px, 96vw)",
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
          popup: "rounded-3xl",
          htmlContainer: "!mx-0 !mt-3 !px-5 !pb-5",
        },
      });
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al cargar el desglose",
      );
    } finally {
      setViewingBreakdownMatchId(null);
    }
  }

  async function handleResetMatchPoints(match: MatchWithDetails) {
    if (isBusy) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar puntuaciones del partido?",
      text: `Se eliminarán los puntos calculados de ${
        match.home_team_code ?? "-"
      } - ${match.away_team_code ?? "-"} y se recalcularán los usuarios afectados.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2a398d",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setResettingMatchId(match.id);

    try {
      const response = await fetch(
        `/api/admin/matches/${match.id}/reset-points`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ?? "No se pudieron eliminar las puntuaciones",
        );
      }

      await showToast(
        "success",
        "Puntuaciones eliminadas",
        `${data.result.deletedPoints} puntos eliminados · ${data.result.recalculatedUsers} usuarios recalculados`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al eliminar puntuaciones",
      );
    } finally {
      setResettingMatchId(null);
    }
  }

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            PARTIDOS
          </span>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-black">
            Gestión de partidos
          </h2>

          <p className="mt-2 text-sm font-medium text-black/45">
            {filteredAndSortedMatches.length} de {initialMatches.length}{" "}
            partidos visibles
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleUpdateAllMatches}
            disabled={isBusy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#2A398D] transition hover:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isUpdatingAllMatches ? "animate-spin" : ""
              }`}
            />
            {isUpdatingAllMatches ? "ACTUALIZANDO..." : "ACTUALIZAR DATOS"}
          </button>

          <button
            type="button"
            onClick={handleCalculatePlayedMatches}
            disabled={isBusy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-2.5 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-[#2A398D]/40"
          >
            <Trophy
              className={`h-4 w-4 ${
                isCalculatingPlayedMatches ? "animate-pulse" : ""
              }`}
            />
            {isCalculatingPlayedMatches ? "CALCULANDO..." : "CALCULAR JUGADOS"}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#2A398D]/10 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-black/70">
          <input
            type="checkbox"
            checked={hidePlayedAndCalculated}
            onChange={(event) =>
              handleHidePlayedAndCalculatedChange(event.target.checked)
            }
            className="h-4 w-4 accent-[#2A398D]"
          />
          Ocultar partidos jugados y ya puntuados
        </label>

        <div className="flex flex-wrap gap-2">
          <SortButton
            label="FECHA"
            active={sortKey === "kickoff_at"}
            direction={sortDirection}
            onClick={() => handleSortChange("kickoff_at")}
          />

          <SortButton
            label="ESTADO"
            active={sortKey === "status"}
            direction={sortDirection}
            onClick={() => handleSortChange("status")}
          />

          <SortButton
            label="Nº PARTIDO"
            active={sortKey === "match_number"}
            direction={sortDirection}
            onClick={() => handleSortChange("match_number")}
          />

          <SortButton
            label="PUNTOS"
            active={sortKey === "points_calculated_at"}
            direction={sortDirection}
            onClick={() => handleSortChange("points_calculated_at")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2A398D]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-280 table-fixed border-collapse">
            <thead className="bg-[#2A398D]/10">
              <tr>
                {tableColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-5 py-4 text-xs font-extrabold tracking-[0.14em] text-[#2A398D] uppercase ${column.className}`}
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {paginatedMatches.map((match) => (
                <tr key={match.id} className="transition hover:bg-[#2A398D]/5">
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-fit rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
                          {getRoundLabel(match.round)}
                        </span>

                        {match.group_name && (
                          <span className="w-fit rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/45">
                            GRUPO {match.group_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <TeamMini
                          code={match.home_team_code}
                          flagCode={match.home_team_flag_code}
                          align="right"
                        />

                        <span className="text-xs font-bold text-black/35">
                          VS
                        </span>

                        <TeamMini
                          code={match.away_team_code}
                          flagCode={match.away_team_flag_code}
                        />
                      </div>

                      <p className="text-xs font-medium text-black/40">
                        ID: {match.id}
                        {match.api_match_id
                          ? ` · API: ${match.api_match_id}`
                          : ""}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center text-sm font-bold text-black">
                    {formatKickoffDateTime(match.kickoff_at, {
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <MatchStatusBadge status={match.status} />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    {match.home_score !== null && match.away_score !== null ? (
                      <span className="text-lg font-extrabold text-black">
                        {match.home_score} - {match.away_score}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-black/35">
                        Sin resultado
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <MatchPointsStatus
                        pointsCalculatedAt={match.points_calculated_at}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleFetchMatch(match)}
                        disabled={isBusy}
                        title="Actualizar datos del partido"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#2A398D]/15 bg-white px-3 py-2 text-xs font-bold text-[#2A398D] transition hover:bg-[#2A398D]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <DownloadCloud
                          className={`h-3.5 w-3.5 ${
                            fetchingMatchId === match.id ? "animate-bounce" : ""
                          }`}
                        />
                        {fetchingMatchId === match.id ? "..." : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCalculateMatchPoints(match)}
                        disabled={isBusy}
                        title="Calcular puntos del partido"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2A398D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#22307c] disabled:cursor-not-allowed disabled:bg-[#2A398D]/40"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                        {scoringMatchId === match.id ? "..." : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShowMatchPointsBreakdown(match)}
                        disabled={isBusy || !match.points_calculated_at}
                        title="Ver desglose de puntos"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#2A398D]/15 bg-white px-3 py-2 text-xs font-bold text-[#2A398D] transition hover:bg-[#2A398D]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Eye
                          className={`h-3.5 w-3.5 ${
                            viewingBreakdownMatchId === match.id
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        {viewingBreakdownMatchId === match.id ? "..." : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetMatchPoints(match)}
                        disabled={isBusy}
                        title="Eliminar puntuaciones del partido"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-500/40"
                      >
                        <RotateCcw
                          className={`h-3.5 w-3.5 ${
                            resettingMatchId === match.id ? "animate-spin" : ""
                          }`}
                        />
                        {resettingMatchId === match.id ? "..." : ""}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedMatches.length === 0 && (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className="px-5 py-10 text-center text-sm font-semibold text-black/45"
                  >
                    No hay partidos para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={Math.min(currentPage, totalPages)}
          totalPages={totalPages}
          totalItems={filteredAndSortedMatches.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </article>
  );
}

function MatchPointsBreakdownModal({
  predictions,
}: {
  predictions: MatchPointsBreakdownPrediction[];
}) {
  const calculatedPredictions = predictions.filter(
    (prediction) => prediction.is_calculated,
  );
  const totalPoints = calculatedPredictions.reduce(
    (total, prediction) => total + (prediction.points ?? 0),
    0,
  );

  if (predictions.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-4 text-left">
        <p className="text-sm font-semibold text-black/60">
          Todavía no hay predicciones para este partido.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="grid gap-2 sm:grid-cols-3">
        <SummaryCard label="Predicciones" value={String(predictions.length)} />
        <SummaryCard
          label="Calculadas"
          value={String(calculatedPredictions.length)}
        />
        <SummaryCard label="Puntos totales" value={String(totalPoints)} />
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-2xl border border-black/10">
        <table className="w-full min-w-230 border-collapse text-sm">
          <thead className="sticky top-0 bg-[#2A398D]/10">
            <tr>
              <th className="px-4 py-3 text-left font-extrabold text-[#2A398D]">
                USUARIO
              </th>
              <th className="px-4 py-3 text-center font-extrabold text-[#2A398D]">
                PREDICCIÓN
              </th>
              <th className="px-4 py-3 text-center font-extrabold text-[#2A398D]">
                PUNTOS
              </th>
              <th className="px-4 py-3 text-left font-extrabold text-[#2A398D]">
                MOTIVO
              </th>
              <th className="px-4 py-3 text-left font-extrabold text-[#2A398D]">
                DETALLE
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5 bg-white">
            {predictions.map((prediction) => (
              <tr key={prediction.id}>
                <td className="px-4 py-3 font-semibold text-black">
                  {prediction.full_name || "Usuario sin nombre"}
                </td>
                <td className="px-4 py-3 text-center text-lg font-extrabold text-black/85">
                  {prediction.predicted_home_score} -{" "}
                  {prediction.predicted_away_score}
                </td>
                <td className="px-4 py-3 text-center">
                  {prediction.is_calculated ? (
                    <span className="text-lg font-extrabold text-[#1D4ED8]">
                      {prediction.points ?? 0} pts
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/40">
                      SIN CALCULAR
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-black/70">
                  {getRuleText(prediction.breakdown?.ruleKey)}
                </td>
                <td className="px-4 py-3">
                  <BreakdownSummary breakdown={prediction.breakdown} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#2A398D]/5 px-4 py-3">
      <p className="text-[11px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-[#2A398D]">{value}</p>
    </div>
  );
}

function BreakdownSummary({
  breakdown,
}: {
  breakdown: MatchPredictionBreakdown | null;
}) {
  if (!breakdown) {
    return <span className="text-sm font-semibold text-black/35">—</span>;
  }

  return (
    <div className="grid gap-2 text-xs text-black/70 sm:grid-cols-2">
      <BreakdownPill
        label="Resultado"
        value={`${formatResultLabel(breakdown.predictedResult)} / ${formatResultLabel(breakdown.realResult)}`}
      />
      <BreakdownPill
        label="Marcador"
        value={`${formatScore(breakdown.predictedHomeScore, breakdown.predictedAwayScore)} / ${formatScore(breakdown.realHomeScore, breakdown.realAwayScore)}`}
      />
      <BreakdownPill
        label="Diferencia"
        value={`${formatNullableNumber(breakdown.predictedDifference)} / ${formatNullableNumber(breakdown.realDifference)}`}
      />
    </div>
  );
}

function BreakdownPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/3 px-3 py-2">
      <p className="font-bold text-black/40 uppercase">{label}</p>
      <p className="mt-0.5 font-semibold text-black/75">{value}</p>
    </div>
  );
}

function getRuleText(ruleKey: string | null | undefined): string {
  if (ruleKey === "match_exact_score") return "Adivina resultado exacto";
  if (ruleKey === "match_winner_only") return "Adivina ganador";
  if (ruleKey === "match_winner_and_difference") {
    return "Adivina ganador y diferencia / empate";
  }
  if (ruleKey === "match_one_team_goals") return "Adivina goles de un equipo";
  return "Sin desglose";
}

function formatResultLabel(result: string | null | undefined): string {
  if (result === "home") return "Gana local";
  if (result === "away") return "Gana visitante";
  if (result === "draw") return "Empate";
  return "—";
}

function formatScore(
  home: number | null | undefined,
  away: number | null | undefined,
): string {
  if (home == null || away == null) return "—";
  return `${home} - ${away}`;
}

function formatNullableNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return String(value);
}

type SortButtonProps = {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
};

function SortButton({ label, active, direction, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition hover:scale-95 ${
        active
          ? "border-[#2A398D] bg-[#2A398D] text-white"
          : "border-[#2A398D]/15 bg-white text-[#2A398D] hover:bg-[#2A398D]/10"
      }`}
    >
      <ArrowDownUp className="h-4 w-4" />
      {label}
      {active && (
        <span className="text-xs opacity-80">
          {direction === "asc" ? "ASC" : "DESC"}
        </span>
      )}
    </button>
  );
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-black/45">
        Mostrando {startItem}-{endItem} de {totalItems} partidos
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded-xl border border-[#2A398D]/15 bg-white px-3 py-2 text-xs font-bold text-[#2A398D] transition hover:bg-[#2A398D]/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ANTERIOR
        </button>

        <span className="rounded-xl bg-[#2A398D]/10 px-3 py-2 text-xs font-bold text-[#2A398D]">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="rounded-xl border border-[#2A398D]/15 bg-white px-3 py-2 text-xs font-bold text-[#2A398D] transition hover:bg-[#2A398D]/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          SIGUIENTE
        </button>
      </div>
    </div>
  );
}

type TeamMiniProps = {
  code: string | null;
  flagCode: string | null;
  align?: "left" | "right";
};

function TeamMini({ code, flagCode, align = "left" }: TeamMiniProps) {
  if (!code) {
    return <span className="text-sm font-semibold text-black/35">-</span>;
  }

  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
    >
      {flagCode && (
        <div className="relative aspect-8/5 w-8 overflow-hidden rounded-tr-lg rounded-bl-lg border border-black/5 bg-white shadow-sm">
          <Image
            src={`https://flagcdn.com/w80/${flagCode}.png`}
            alt={`Bandera de ${code}`}
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
      )}

      <span className="text-sm font-extrabold tracking-wide text-black">
        {code}
      </span>
    </div>
  );
}

function MatchStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="rounded-full bg-green-700/10 px-3 py-1 text-xs font-bold text-green-800">
        {getMatchStatusLabel(status)}
      </span>
    );
  }

  if (status === "live") {
    return (
      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600">
        {getMatchStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/45">
      {getMatchStatusLabel(status)}
    </span>
  );
}

function MatchPointsStatus({
  pointsCalculatedAt,
}: {
  pointsCalculatedAt: string | null;
}) {
  if (!pointsCalculatedAt) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/45">
        SIN PUNTUAR
      </span>
    );
  }

  return (
    <div className="text-center">
      <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-xs font-bold text-[#2A398D]">
        PUNTUADO
      </span>
    </div>
  );
}

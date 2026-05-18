"use client";

import { MatchWithDetails } from "@/types";
import Image from "next/image";
import {
  ArrowDownUp,
  Calculator,
  DownloadCloud,
  RefreshCw,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Props = {
  initialMatches: MatchWithDetails[];
};

type SortKey =
  | "kickoff_at"
  | "status"
  | "points_calculated_at"
  | "match_number";

const PAGE_SIZE = 5;

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

function parseUtcDate(dateString: string) {
  return new Date(dateString.replace(" ", "T"));
}

function formatKickoffDateTime(dateString: string) {
  const date = parseUtcDate(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getRoundLabel(round: string) {
  switch (round) {
    case "group":
      return "GRUPOS";
    case "R32":
      return "DIECISEISAVOS";
    case "R16":
      return "OCTAVOS";
    case "QF":
      return "CUARTOS";
    case "SF":
      return "SEMIFINAL";
    case "3r":
      return "3/4 PUESTO";
    case "final":
      return "FINAL";
    default:
      return round.toUpperCase();
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "PROGRAMADO";
    case "live":
      return "EN DIRECTO";
    case "completed":
      return "JUGADO";
    default:
      return status.toUpperCase();
  }
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

  const [resettingMatchId, setResettingMatchId] = useState<number | null>(null);

  const isBusy =
    isUpdatingAllMatches ||
    isCalculatingPlayedMatches ||
    fetchingMatchId !== null ||
    scoringMatchId !== null ||
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

      if (!response.ok || data?.ok === false) {
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

      if (!response.ok || data?.ok === false) {
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

      if (!response.ok || data?.ok === false) {
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

      if (!response.ok || data?.ok === false) {
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

      if (!response.ok || data?.ok === false) {
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
                    {formatKickoffDateTime(match.kickoff_at)}
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
        <div className="overflow-hidden rounded-tr-lg rounded-bl-lg border border-black/5 bg-white shadow-sm">
          <Image
            src={`https://flagcdn.com/w80/${flagCode}.png`}
            alt={`Bandera de ${code}`}
            width={32}
            height={20}
            className="h-auto w-8 object-cover"
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
        {getStatusLabel(status)}
      </span>
    );
  }

  if (status === "live") {
    return (
      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600">
        {getStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/45">
      {getStatusLabel(status)}
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

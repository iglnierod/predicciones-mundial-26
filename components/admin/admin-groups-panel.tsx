"use client";

import { GroupWithQualifiedTeams } from "@/types";
import Image from "next/image";
import { DownloadCloud, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Props = {
  initialGroups: GroupWithQualifiedTeams[];
};

const tableColumns = [
  {
    key: "group",
    name: "GRUPO",
    className: "text-left",
  },
  {
    key: "qualified_team_a",
    name: "CLASIFICADO A",
    className: "text-center",
  },
  {
    key: "qualified_team_b",
    name: "CLASIFICADO B",
    className: "text-center",
  },
  {
    key: "status",
    name: "ESTADO",
    className: "text-center",
  },
  {
    key: "actions",
    name: "ACCIONES",
    className: "text-right",
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

export default function AdminGroupsPanel({ initialGroups }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);

  const [isFetching, setIsFetching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [fetchingGroupId, setFetchingGroupId] = useState<number | null>(null);
  const [scoringGroupId, setScoringGroupId] = useState<number | null>(null);
  const [resettingGroupId, setResettingGroupId] = useState<number | null>(null);

  const isBusy =
    isFetching ||
    isScoring ||
    isResetting ||
    fetchingGroupId !== null ||
    scoringGroupId !== null ||
    resettingGroupId !== null;

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  async function handleFetchGroups() {
    if (isBusy) return;

    setIsFetching(true);

    try {
      const response = await fetch("/api/admin/groups/fetch", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron actualizar los grupos");
      }

      router.refresh();

      await showToast(
        "success",
        "Grupos actualizados",
        `${data.result.updatedGroups} grupos actualizados`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al actualizar los grupos",
      );
    } finally {
      setIsFetching(false);
    }
  }

  async function handleFetchSingleGroup(groupId: number) {
    if (isBusy) return;

    setFetchingGroupId(groupId);

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/fetch`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudo actualizar el grupo");
      }

      router.refresh();

      await showToast(
        "success",
        `Grupo ${data.result.groupName} actualizado`,
        "Clasificados actualizados correctamente",
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al actualizar el grupo",
      );
    } finally {
      setFetchingGroupId(null);
    }
  }

  async function handleCalculateGroupPoints() {
    if (isBusy) return;

    setIsScoring(true);

    try {
      const response = await fetch("/api/admin/groups/calculate-points", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron calcular los puntos");
      }

      router.refresh();

      await showToast(
        "success",
        "Puntos calculados",
        `${data.result.calculatedPredictions ?? 0} predicciones calculadas`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al calcular los puntos",
      );
    } finally {
      setIsScoring(false);
    }
  }

  async function handleCalculateSingleGroupPoints(groupId: number) {
    if (isBusy) return;

    setScoringGroupId(groupId);

    try {
      const response = await fetch(
        `/api/admin/groups/${groupId}/calculate-points`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ?? "No se pudieron calcular los puntos del grupo",
        );
      }

      router.refresh();

      await showToast(
        "success",
        `Grupo ${data.result.groupName ?? groupId} puntuado`,
        `${data.result.calculatedPredictions ?? 0} predicciones calculadas`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al puntuar el grupo",
      );
    } finally {
      setScoringGroupId(null);
    }
  }

  async function handleResetGroups() {
    if (isBusy) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "¿Resetear clasificados de grupos?",
      text: "Se eliminarán los equipos clasificados de todos los grupos. Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, resetear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2a398d",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setIsResetting(true);

    try {
      const response = await fetch("/api/admin/groups/reset", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron resetear los grupos");
      }

      router.refresh();

      await showToast(
        "success",
        "Grupos reseteados",
        `${data.result.resetGroups} grupos · ${data.result.deletedPoints} puntos eliminados · ${data.result.recalculatedUsers} usuarios recalculados`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al resetear los grupos",
      );
    } finally {
      setIsResetting(false);
    }
  }

  async function handleResetSingleGroup(group: GroupWithQualifiedTeams) {
    if (isBusy) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: `¿Resetear grupo ${group.name}?`,
      text: "Se eliminarán los clasificados, las puntuaciones de este grupo y se recalcularán los usuarios afectados.",
      showCancelButton: true,
      confirmButtonText: "Sí, resetear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2a398d",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setResettingGroupId(group.id);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}/reset`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudo resetear el grupo");
      }

      await showToast(
        "success",
        `Grupo ${group.name} reseteado`,
        `${data.result.deletedPoints} puntos eliminados · ${data.result.recalculatedUsers} usuarios recalculados`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al resetear el grupo",
      );
    } finally {
      setResettingGroupId(null);
    }
  }

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            GRUPOS
          </span>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-black">
            Gestión de grupos
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#2A398D] transition hover:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleFetchGroups}
            disabled={isBusy}
          >
            <DownloadCloud className="h-4 w-4" />
            {isFetching ? "FETCHING..." : "FETCH"}
          </button>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-2.5 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-[#2A398D]/40"
            onClick={handleCalculateGroupPoints}
            disabled={isBusy}
          >
            <Trophy className="h-4 w-4" />
            {isScoring ? "PUNTUANDO..." : "PUNTUAR"}
          </button>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-red-500/40"
            onClick={handleResetGroups}
            disabled={isBusy}
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "RESETEANDO..." : "RESETEAR"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2A398D]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl table-fixed border-collapse">
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
              {groups.map((group) => (
                <tr key={group.id} className="transition hover:bg-[#2A398D]/5">
                  <td className="px-5 py-4 text-left">
                    <div>
                      <p className="text-sm font-extrabold text-black">
                        Grupo {group.name}
                      </p>

                      <p className="text-xs font-medium text-black/40">
                        ID: {group.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <QualifiedTeamCell
                        code={group.qualified_team_a_code}
                        flagCode={group.qualified_team_a_flag_code}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <QualifiedTeamCell
                        code={group.qualified_team_b_code}
                        flagCode={group.qualified_team_b_flag_code}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <GroupScoringStatus
                        isScored={group.is_scored}
                        scoredPredictionsCount={group.scored_predictions_count}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleFetchSingleGroup(group.id)}
                        disabled={isBusy}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#2A398D]/15 bg-white px-3 py-2 text-xs font-bold text-[#2A398D] transition hover:bg-[#2A398D]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        {fetchingGroupId === group.id ? "..." : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCalculateSingleGroupPoints(group.id)
                        }
                        disabled={isBusy}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2A398D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#22307c] disabled:cursor-not-allowed disabled:bg-[#2A398D]/40"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        {scoringGroupId === group.id ? "..." : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetSingleGroup(group)}
                        disabled={isBusy}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-500/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {resettingGroupId === group.id ? "..." : ""}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {groups.length === 0 && (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className="px-5 py-10 text-center text-sm font-semibold text-black/45"
                  >
                    No hay grupos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

type QualifiedTeamCellProps = {
  code: string | null;
  flagCode: string | null;
};

function QualifiedTeamCell({ code, flagCode }: QualifiedTeamCellProps) {
  if (!code) {
    return (
      <span className="text-sm font-semibold text-black/35">Sin definir</span>
    );
  }

  return (
    <div className="flex items-center gap-3">
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

type GroupScoringStatusProps = {
  isScored: boolean;
  scoredPredictionsCount: number;
};

function GroupScoringStatus({
  isScored,
  scoredPredictionsCount,
}: GroupScoringStatusProps) {
  if (!isScored) {
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

      <p className="mt-1 text-[11px] font-medium text-black/40">
        {scoredPredictionsCount} predicciones
      </p>
    </div>
  );
}

"use client";

import { GroupWithQualifiedTeams } from "@/types";
import Image from "next/image";
import { DownloadCloud, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";

type Props = {
  initialGroups: GroupWithQualifiedTeams[];
};

const tableColumns = [
  {
    key: "group",
    name: "GRUPO",
  },
  {
    key: "qualified_team_a",
    name: "CLASIFICADO A",
  },
  {
    key: "qualified_team_b",
    name: "CLASIFICADO B",
  },
];

export default function AdminGroupsPanel({ initialGroups }: Props) {
  const [isFetching, setIsFetching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleFetchGroups() {
    if (isFetching) return;

    setIsFetching(true);

    try {
      const response = await fetch("/api/admin/groups/fetch", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudieron actualizar los grupos");
      }

      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleCalculateGroupPoints() {
    if (isScoring) return;

    setIsScoring(true);

    try {
      const response = await fetch("/api/admin/groups/calculate-points", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudieron calcular los puntos");
      }

      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScoring(false);
    }
  }

  async function handleResetGroups() {
    if (isResetting) return;

    setIsResetting(true);

    try {
      const response = await fetch("/api/admin/groups/reset", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudieron resetear los grupos");
      }

      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsResetting(false);
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#2A398D] transition hover:scale-95"
            onClick={handleFetchGroups}
            disabled={isFetching || isScoring || isResetting}
          >
            <DownloadCloud className="h-4 w-4" />
            {isFetching ? "FETCHING..." : "FETCH"}
          </button>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-2.5 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-[#2A398D]/40"
            onClick={handleCalculateGroupPoints}
            disabled={isFetching || isScoring || isResetting}
          >
            <Trophy className="h-4 w-4" />
            {isScoring ? "PUNTUANDO..." : "PUNTUAR"}
          </button>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:scale-95 disabled:cursor-not-allowed disabled:bg-red-500/40"
            onClick={handleResetGroups}
            disabled={isFetching || isScoring || isResetting}
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "RESETEANDO..." : "RESETEAR"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2A398D]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse">
            <thead className="bg-[#2A398D]/10">
              <tr>
                {tableColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-5 py-4 text-left text-xs font-extrabold tracking-[0.14em] text-[#2A398D] uppercase"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {initialGroups.map((group) => (
                <tr key={group.id} className="transition hover:bg-[#2A398D]/5">
                  <td className="px-5 py-4">
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
                    <QualifiedTeamCell
                      code={group.qualified_team_a_code}
                      flagCode={group.qualified_team_a_flag_code}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <QualifiedTeamCell
                      code={group.qualified_team_b_code}
                      flagCode={group.qualified_team_b_flag_code}
                    />
                  </td>
                </tr>
              ))}

              {initialGroups.length === 0 && (
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
            className="h-5 w-8 object-cover"
          />
        </div>
      )}

      <span className="text-sm font-extrabold tracking-wide text-black">
        {code}
      </span>
    </div>
  );
}

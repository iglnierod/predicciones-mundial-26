"use client";

import { useMemo, useState } from "react";
import type { Group, GroupPredictionSelection } from "@/types";
import Image from "next/image";

type Props = {
  groups?: Group[];
  onSubmit: (selection: GroupPredictionSelection) => void;
};

export default function PredictGroupsModalContent({
  groups = [],
  onSubmit,
}: Props) {
  const initialSelection = useMemo<GroupPredictionSelection>(() => {
    return groups.reduce((acc, group) => {
      acc[group.id] = [];
      return acc;
    }, {} as GroupPredictionSelection);
  }, [groups]);

  const [selection, setSelection] =
    useState<GroupPredictionSelection>(initialSelection);

  const toggleTeam = (groupId: number, teamId: number) => {
    setSelection((prev) => {
      const selectedTeams = prev[groupId] ?? [];
      const isSelected = selectedTeams.includes(teamId);

      if (isSelected) {
        return {
          ...prev,
          [groupId]: selectedTeams.filter((id) => id !== teamId),
        };
      }

      if (selectedTeams.length >= 2) {
        return prev;
      }

      return {
        ...prev,
        [groupId]: [...selectedTeams, teamId],
      };
    });
  };

  const allGroupsValid =
    groups.length > 0 &&
    groups.every((group) => (selection[group.id] ?? []).length === 2);

  return (
    <div className="max-h-[70vh] overflow-y-auto px-1 text-left">
      <p className="mb-5 text-sm text-white/70">
        Selecciona <strong className="text-white">2 equipos</strong> por cada
        grupo.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((group) => {
          const selectedIds = selection[group.id] ?? [];

          return (
            <section
              key={group.id}
              className="rounded-2xl border border-white/8 bg-[#3A3D42] p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Grupo {group.name}
                </h3>
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/65">
                  {selectedIds.length}/2 seleccionados
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.teams?.map((team) => {
                  const isSelected = selectedIds.includes(team.id);
                  const isDisabled = !isSelected && selectedIds.length >= 2;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeam(group.id, team.id)}
                      disabled={isDisabled}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-[#5B7CFA] bg-[#2A398D] text-white shadow-md"
                          : "border-white/8 bg-[#44474D] text-white hover:border-white/15 hover:bg-[#4D5057]"
                      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex h-6 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-white/90">
                        <Image
                          src={`https://flagcdn.com/w80/${team.flag_code}.png`}
                          alt={`Bandera de ${team.name}`}
                          width={36}
                          height={24}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {team.name}
                        </p>
                        <p
                          className={`text-xs ${
                            isSelected ? "text-white/75" : "text-white/55"
                          }`}
                        >
                          {team.code}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onSubmit(selection)}
          disabled={!allGroupsValid}
          className="rounded-xl bg-[#5B7CFA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6B89FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar predicciones
        </button>
      </div>
    </div>
  );
}

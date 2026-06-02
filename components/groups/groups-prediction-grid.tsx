"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { saveGroupPrediction } from "@/app/(main)/groups/actions";
import type {
  Group,
  GroupPredictionResults,
  GroupPredictionSelection,
} from "@/types";
import GroupComponent from "./group";

type Props = {
  groups: Group[];
  initialSelection: GroupPredictionSelection;
  predictionResults: GroupPredictionResults;
  isClosed: boolean;
  closeAt: string | null;
};

type GroupStatus = {
  state: "idle" | "saving" | "saved" | "cleared" | "error";
  message: string | null;
};

function isCloseAtReached(closeAt: string | null) {
  if (!closeAt) return false;

  return Date.now() >= new Date(closeAt).getTime();
}

function normalizeSelection(selection: GroupPredictionSelection) {
  return Object.entries(selection).reduce<GroupPredictionSelection>(
    (acc, [groupId, teamIds]) => {
      acc[Number(groupId)] = teamIds.slice(0, 2);
      return acc;
    },
    {},
  );
}

export default function GroupsPredictionGrid({
  groups,
  initialSelection,
  predictionResults,
  isClosed,
  closeAt,
}: Props) {
  const normalizedInitialSelection = useMemo(
    () => normalizeSelection(initialSelection),
    [initialSelection],
  );
  const [selection, setSelection] = useState<GroupPredictionSelection>(
    normalizedInitialSelection,
  );
  const [persistedSelection, setPersistedSelection] =
    useState<GroupPredictionSelection>(normalizedInitialSelection);
  const [groupStatus, setGroupStatus] = useState<Record<number, GroupStatus>>(
    {},
  );
  const [visibleResults, setVisibleResults] =
    useState<GroupPredictionResults>(predictionResults);
  const [predictionsClosed, setPredictionsClosed] = useState(
    () => isClosed || isCloseAtReached(closeAt),
  );

  const closeAtText = useMemo(() => {
    if (!closeAt) return null;

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(closeAt));
  }, [closeAt]);

  useEffect(() => {
    if (!closeAt || predictionsClosed) return;

    const delay = new Date(closeAt).getTime() - Date.now();
    const timeoutId = window.setTimeout(
      () => {
        setPredictionsClosed(true);
      },
      Math.max(delay, 0),
    );

    return () => window.clearTimeout(timeoutId);
  }, [closeAt, predictionsClosed]);

  async function persistGroupSelection(
    groupId: number,
    teamIds: number[],
    previousPersistedTeamIds: number[],
  ) {
    setGroupStatus((prev) => ({
      ...prev,
      [groupId]: { state: "saving", message: null },
    }));

    const result = await saveGroupPrediction({ groupId, teamIds });

    if (!result.success) {
      setSelection((prev) => ({
        ...prev,
        [groupId]: previousPersistedTeamIds,
      }));
      setGroupStatus((prev) => ({
        ...prev,
        [groupId]: {
          state: "error",
          message: result.error ?? "No se pudo guardar el grupo.",
        },
      }));

      void Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: result.error ?? "No se pudo guardar el grupo.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        showCloseButton: true,
        width: 500,
      });
      return;
    }

    setPersistedSelection((prev) => ({ ...prev, [groupId]: teamIds }));
    setVisibleResults((prev) => {
      if (!prev[groupId]) return prev;

      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setGroupStatus((prev) => ({
      ...prev,
      [groupId]: {
        state: teamIds.length === 2 ? "saved" : "cleared",
        message:
          teamIds.length === 2 ? "Predicción guardada" : "Predicción eliminada",
      },
    }));
  }

  function handleToggleTeam(groupId: number, teamId: number) {
    if (predictionsClosed || groupStatus[groupId]?.state === "saving") return;

    const currentTeamIds = selection[groupId] ?? [];
    const previousPersistedTeamIds = persistedSelection[groupId] ?? [];
    const isSelected = currentTeamIds.includes(teamId);

    if (!isSelected && currentTeamIds.length >= 2) return;

    const nextTeamIds = isSelected
      ? currentTeamIds.filter((id) => id !== teamId)
      : [...currentTeamIds, teamId];

    setSelection((prev) => ({ ...prev, [groupId]: nextTeamIds }));
    setGroupStatus((prev) => ({
      ...prev,
      [groupId]: { state: "idle", message: null },
    }));

    if (nextTeamIds.length === 2) {
      void persistGroupSelection(
        groupId,
        nextTeamIds,
        previousPersistedTeamIds,
      );
      return;
    }

    if (currentTeamIds.length === 2 && previousPersistedTeamIds.length === 2) {
      void persistGroupSelection(groupId, [], previousPersistedTeamIds);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`rounded-3xl border p-4 shadow-sm ${
          predictionsClosed
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-[#2A398D]/10 bg-white/85 text-black/70"
        }`}
      >
        <p className="text-sm font-bold">
          {predictionsClosed
            ? "Las predicciones de grupos están cerradas."
            : "Selecciona 2 equipos por grupo. Se guardan automáticamente al completar cada grupo."}
        </p>

        {closeAtText && (
          <p className="mt-1 text-sm">
            Cierre automático: {closeAtText}, 1 minuto antes del primer partido.
          </p>
        )}

        {!closeAtText && (
          <p className="mt-1 text-sm">
            El cierre se calculará cuando haya partidos cargados.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <GroupComponent
            key={group.id}
            group={group}
            selectedTeamIds={selection[group.id] ?? []}
            result={visibleResults[group.id]}
            disabled={predictionsClosed}
            status={groupStatus[group.id]}
            onToggleTeam={(teamId) => handleToggleTeam(group.id, teamId)}
          />
        ))}
      </div>
    </div>
  );
}

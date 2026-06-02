import { Group, GroupPredictionResult } from "@/types";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import GroupTeam from "./group-team";

type Props = {
  group: Group;
  selectedTeamIds?: number[];
  result?: GroupPredictionResult;
  disabled?: boolean;
  status?: {
    state: "idle" | "saving" | "saved" | "cleared" | "error";
    message: string | null;
  };
  onToggleTeam?: (teamId: number) => void;
};

export default function GroupComponent({
  group,
  selectedTeamIds = [],
  result,
  disabled = false,
  status,
  onToggleTeam,
}: Props) {
  const selectedCount = selectedTeamIds.length;
  const isSaving = status?.state === "saving";
  const isComplete = selectedCount === 2;

  const statusContent = (() => {
    if (status?.state === "saving") {
      return {
        className: "bg-[#2A398D]/10 text-[#2A398D]",
        label: "GUARDANDO...",
        icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />,
      };
    }

    if (status?.state === "error") {
      return {
        className: "bg-red-100 text-red-700",
        label: "ERROR",
        icon: <XCircle className="h-3.5 w-3.5" />,
      };
    }

    if (result) {
      return {
        className:
          result.points > 0
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700",
        label: `${result.points > 0 ? "+" : ""}${result.points} PTS`,
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    }

    if (status?.state === "cleared") {
      return {
        className: "bg-amber-100 text-amber-700",
        label: "ELIMINADA",
        icon: null,
      };
    }

    if (disabled) {
      return {
        className: "bg-red-100 text-red-700",
        label: "CERRADO",
        icon: null,
      };
    }

    if (isComplete) {
      return {
        className: "bg-green-100 text-green-700",
        label: "GUARDADO",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    }

    return {
      className: "bg-[#2A398D]/10 text-[#2A398D]",
      label: "PENDIENTE",
      icon: null,
    };
  })();

  return (
    <section className="rounded-3xl border border-black/5 bg-white/85 p-4 text-black shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            GRUPO
          </div>
          <h2 className="text-xl font-extrabold tracking-wide text-black">
            {group.name}
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${statusContent.className}`}
          >
            {statusContent.icon}
            {statusContent.label}
          </span>
          <span className="text-xs font-semibold text-black/45">
            {selectedCount}/2
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {group.teams?.map((team) => {
          const isSelected = selectedTeamIds.includes(team.id);
          const resultStatus = result
            ? result.matchedTeamIds.includes(team.id)
              ? "correct"
              : isSelected
                ? "incorrect"
                : null
            : null;
          const isDisabled =
            disabled ||
            isSaving ||
            (!isSelected && selectedTeamIds.length >= 2);

          return (
            <GroupTeam
              key={team.id}
              team={team}
              isPredicted={isSelected}
              resultStatus={resultStatus}
              disabled={isDisabled}
              onClick={() => onToggleTeam?.(team.id)}
            />
          );
        })}
      </div>

      {status?.state === "error" && status.message && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          {status.message}
        </p>
      )}

      {!disabled && !isComplete && status?.state !== "error" && (
        <p className="mt-3 text-sm font-medium text-black/50">
          Selecciona {2 - selectedCount} equipo
          {2 - selectedCount === 1 ? "" : "s"} más para guardar.
        </p>
      )}
    </section>
  );
}

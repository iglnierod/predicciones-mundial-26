"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Eye,
  LoaderCircle,
  RotateCcw,
  Save,
  Trophy,
  UsersRound,
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  TOURNAMENT_PREDICTION_FIELDS,
  type TournamentPredictionFieldConfig,
} from "@/lib/predictions/tournament-fields";
import type { ScoringRulesMap } from "@/lib/scoring/types";
import {
  buildTournamentProcessedKey,
  calculateTournamentPredictionPoints,
  countResolvedTournamentFields,
} from "@/lib/scoring/tournament-points";
import type {
  Team,
  TournamentPredictionFieldBreakdown,
  TournamentPredictionFormValues,
  TournamentPredictionPointsBreakdown,
  TournamentResult,
} from "@/types";
import type {
  AdminGlobalPredictionsData,
  AdminTournamentPrediction,
} from "@/lib/repositories/tournament-predictions-repository";

type Props = {
  initialData: AdminGlobalPredictionsData;
  scoringRules: ScoringRulesMap;
};

type FieldStats = {
  field: TournamentPredictionFieldConfig;
  answeredCount: number;
  correctCount: number;
  previewCorrectCount: number;
  awardedPoints: number;
  isResolved: boolean;
};

const MySwal = withReactContent(Swal);

function getFormValuesFromResult(
  result: TournamentResult | null,
): TournamentPredictionFormValues {
  return {
    world_cup_winner_team_id: result?.world_cup_winner_team_id ?? null,
    top_scorer: result?.top_scorer ?? "",
    top_assist: result?.top_assist ?? "",
    hat_trick_player: result?.hat_trick_player ?? "",
    most_goals_in_a_match_team_id:
      result?.most_goals_in_a_match_team_id ?? null,
    how_many_penalty_shootouts: result?.how_many_penalty_shootouts ?? "",
    underdog_quarterfinal_team_id:
      result?.underdog_quarterfinal_team_id ?? null,
    spain_top_scorer: result?.spain_top_scorer ?? "",
    spain_top_assist: result?.spain_top_assist ?? "",
    spain_red_card_player: result?.spain_red_card_player ?? "",
    spain_round: result?.spain_round ?? "",
    spain_total_goals: result?.spain_total_goals ?? "",
  };
}

function isEmptyValue(value: unknown) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function buildFormStorageKey(values: TournamentPredictionFormValues) {
  return JSON.stringify(
    Object.fromEntries(
      TOURNAMENT_PREDICTION_FIELDS.map((field) => {
        const value = values[field.name];

        if (field.type === "team-select") {
          return [field.name, typeof value === "number" ? value : null];
        }

        return [
          field.name,
          typeof value === "string" && value.trim() !== ""
            ? value.trim()
            : null,
        ];
      }),
    ),
  );
}

function formatPoints(points: number) {
  return points === 1 ? "1 pto" : `${points} pts`;
}

function getFieldPoints(
  field: TournamentPredictionFieldConfig,
  scoringRules: ScoringRulesMap,
) {
  return scoringRules[field.scoringRuleKey] ?? field.points;
}

function getTeamOptions(
  field: TournamentPredictionFieldConfig,
  teams: Team[],
  selectedTeamId: number | null,
) {
  if (field.type !== "team-select") return [];

  const baseTeams = field.top10
    ? teams.filter((team) => team.is_top10_ranking_fifa === false)
    : teams;
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;

  if (selectedTeam && !baseTeams.some((team) => team.id === selectedTeam.id)) {
    return [selectedTeam, ...baseTeams];
  }

  return baseTeams;
}

function getFieldValue(
  row:
    | TournamentPredictionFormValues
    | AdminTournamentPrediction
    | TournamentResult,
  fieldName: keyof TournamentPredictionFormValues,
) {
  return row[fieldName] ?? null;
}

function formatFieldValue(
  field: TournamentPredictionFieldConfig,
  value: string | number | null,
  teamsById: Map<number, Team>,
) {
  if (isEmptyValue(value)) return "Sin respuesta";

  if (field.type === "team-select") {
    const team = typeof value === "number" ? teamsById.get(value) : null;

    return team ? `${team.name} (${team.code})` : `Equipo #${value}`;
  }

  if (field.type === "select") {
    return (
      field.options.find((option) => option.value === value)?.label ??
      String(value)
    );
  }

  return String(value);
}

async function showToast(
  icon: "success" | "error" | "warning",
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
    timer: 2600,
    timerProgressBar: true,
    showCloseButton: true,
    width: 440,
  });
}

export default function AdminGlobalPredictionsPanel({
  initialData,
  scoringRules,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<TournamentPredictionFormValues>(
    () => getFormValuesFromResult(initialData.result),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const teamsById = useMemo(
    () => new Map(initialData.teams.map((team) => [team.id, team])),
    [initialData.teams],
  );
  const generalFields = useMemo(
    () =>
      TOURNAMENT_PREDICTION_FIELDS.filter(
        (field) => field.section === "general",
      ),
    [],
  );
  const spainFields = useMemo(
    () =>
      TOURNAMENT_PREDICTION_FIELDS.filter((field) => field.section === "spain"),
    [],
  );
  const savedFormKey = useMemo(
    () => buildFormStorageKey(getFormValuesFromResult(initialData.result)),
    [initialData.result],
  );
  const formKey = useMemo(() => buildFormStorageKey(formValues), [formValues]);
  const hasUnsavedChanges = formKey !== savedFormKey;
  const currentProcessedKey = useMemo(
    () => buildTournamentProcessedKey(initialData.result),
    [initialData.result],
  );
  const resolvedFields = countResolvedTournamentFields(initialData.result);
  const calculatedPredictions = initialData.predictions.filter(
    (prediction) => prediction.is_calculated,
  ).length;
  const currentCalculatedPredictions = initialData.predictions.filter(
    (prediction) => prediction.breakdown?.processedKey === currentProcessedKey,
  ).length;
  const staleCalculatedPredictions = Math.max(
    calculatedPredictions - currentCalculatedPredictions,
    0,
  );
  const hasStalePoints = staleCalculatedPredictions > 0;
  const isFullyCalculated =
    initialData.predictions.length > 0 &&
    currentCalculatedPredictions === initialData.predictions.length;
  const totalAwardedPoints = initialData.predictions.reduce(
    (total, prediction) =>
      prediction.breakdown?.processedKey === currentProcessedKey
        ? total + (prediction.points ?? 0)
        : total,
    0,
  );
  const previewBreakdowns = useMemo(() => {
    if (!initialData.result)
      return new Map<number, TournamentPredictionPointsBreakdown>();

    return new Map(
      initialData.predictions.map((prediction) => [
        prediction.id,
        calculateTournamentPredictionPoints({
          prediction,
          result: initialData.result!,
          scoringRules,
        }),
      ]),
    );
  }, [initialData.predictions, initialData.result, scoringRules]);
  const fieldStats = useMemo<FieldStats[]>(
    () =>
      TOURNAMENT_PREDICTION_FIELDS.map((field) => {
        let answeredCount = 0;
        let correctCount = 0;
        let previewCorrectCount = 0;
        let awardedPoints = 0;

        for (const prediction of initialData.predictions) {
          if (!isEmptyValue(getFieldValue(prediction, field.name))) {
            answeredCount++;
          }

          const currentBreakdown =
            prediction.breakdown?.processedKey === currentProcessedKey
              ? prediction.breakdown
              : null;
          const currentFieldBreakdown = currentBreakdown?.fields[field.name];
          const previewFieldBreakdown = previewBreakdowns.get(prediction.id)
            ?.fields[field.name];

          if (currentFieldBreakdown?.isCorrect) correctCount++;
          if (previewFieldBreakdown?.isCorrect) previewCorrectCount++;
          awardedPoints += currentFieldBreakdown?.points ?? 0;
        }

        return {
          field,
          answeredCount,
          correctCount,
          previewCorrectCount,
          awardedPoints,
          isResolved: initialData.result
            ? !isEmptyValue(getFieldValue(initialData.result, field.name))
            : false,
        };
      }),
    [
      currentProcessedKey,
      initialData.predictions,
      initialData.result,
      previewBreakdowns,
    ],
  );
  const isBusy = isSaving || isCalculating || isResetting || isPending;
  const canCalculate =
    !isBusy &&
    !hasUnsavedChanges &&
    resolvedFields > 0 &&
    initialData.predictions.length > 0;

  function updateField<K extends keyof TournamentPredictionFormValues>(
    name: K,
    value: TournamentPredictionFormValues[K],
  ) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));
  }

  async function handleSaveResult() {
    if (isBusy || !hasUnsavedChanges) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/globals/result", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: formValues }),
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ?? "No se pudo guardar el resultado global",
        );
      }

      startTransition(() => router.refresh());

      await showToast(
        "success",
        "Respuestas oficiales guardadas",
        calculatedPredictions > 0
          ? "Recalcula los puntos si las respuestas oficiales han cambiado."
          : undefined,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al guardar respuestas oficiales",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCalculatePoints() {
    if (!canCalculate) {
      await showToast(
        "warning",
        hasUnsavedChanges
          ? "Guarda los cambios antes de calcular"
          : "No hay datos suficientes para calcular",
      );
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: hasStalePoints
        ? "¿Recalcular puntos globales?"
        : "¿Calcular puntos globales?",
      text: `Se calcularán ${initialData.predictions.length} predicciones con ${resolvedFields}/12 respuestas oficiales definidas.`,
      showCancelButton: true,
      confirmButtonText: hasStalePoints ? "Sí, recalcular" : "Sí, calcular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2a398d",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setIsCalculating(true);

    try {
      const response = await fetch("/api/admin/globals/calculate-points", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron calcular los puntos");
      }

      startTransition(() => router.refresh());

      await showToast(
        "success",
        "Puntos globales calculados",
        `${data.result.calculatedPredictions ?? 0} predicciones, ${data.result.totalAwardedPoints ?? 0} puntos repartidos`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al calcular puntos globales",
      );
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleResetPoints() {
    if (isBusy || calculatedPredictions === 0) return;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "¿Resetear puntos globales?",
      text: "Se eliminarán los puntos globales calculados y se recalculará el total de los usuarios afectados. Las respuestas oficiales no cambiarán.",
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
      const response = await fetch("/api/admin/globals/reset-points", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? "No se pudieron resetear los puntos");
      }

      startTransition(() => router.refresh());

      await showToast(
        "success",
        "Puntos globales reseteados",
        `${data.result.deletedPoints ?? 0} filas eliminadas`,
      );
    } catch (error) {
      console.error(error);

      await showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error inesperado al resetear puntos globales",
      );
    } finally {
      setIsResetting(false);
    }
  }

  async function handleShowFieldPredictions(stats: FieldStats) {
    await MySwal.fire({
      title: stats.field.label,
      html: (
        <FieldPredictionsModal
          stats={stats}
          predictions={initialData.predictions}
          result={initialData.result}
          teamsById={teamsById}
          currentProcessedKey={currentProcessedKey}
          previewBreakdowns={previewBreakdowns}
        />
      ),
      width: "min(1100px, 96vw)",
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: "rounded-3xl",
        htmlContainer: "!mx-0 !mt-3 !px-5 !pb-5",
      },
    });
  }

  async function handleShowAllPredictions() {
    await MySwal.fire({
      title: "Predicciones globales de usuarios",
      html: (
        <AllPredictionsModal
          predictions={initialData.predictions}
          teamsById={teamsById}
          currentProcessedKey={currentProcessedKey}
        />
      ),
      width: "min(1150px, 96vw)",
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: "rounded-3xl",
        htmlContainer: "!mx-0 !mt-3 !px-5 !pb-5",
      },
    });
  }

  function renderResultField(field: TournamentPredictionFieldConfig) {
    const value = formValues[field.name];
    const points = getFieldPoints(field, scoringRules);

    return (
      <label key={field.name} className="block space-y-2">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] font-bold tracking-wide text-black">
          <span>{field.label}</span>
          <span className="text-xs font-semibold tracking-normal text-black/45">
            {formatPoints(points)}
          </span>
        </span>

        {field.type === "text" ? (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            disabled={isBusy}
            onChange={(event) =>
              updateField(
                field.name,
                event.target
                  .value as TournamentPredictionFormValues[typeof field.name],
              )
            }
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none placeholder:text-black/35 focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
          />
        ) : field.type === "team-select" ? (
          <select
            value={typeof value === "number" ? value : ""}
            disabled={isBusy}
            onChange={(event) => {
              const rawValue = event.target.value;
              updateField(
                field.name,
                (rawValue === ""
                  ? null
                  : Number(
                      rawValue,
                    )) as TournamentPredictionFormValues[typeof field.name],
              );
            }}
            className="w-full cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
          >
            <option value="">
              {field.placeholder ?? "Selecciona un equipo"}
            </option>
            {getTeamOptions(
              field,
              initialData.teams,
              typeof value === "number" ? value : null,
            ).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={typeof value === "string" ? value : ""}
            disabled={isBusy}
            onChange={(event) =>
              updateField(
                field.name,
                event.target
                  .value as TournamentPredictionFormValues[typeof field.name],
              )
            }
            className="w-full cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
          >
            <option value="">
              {field.placeholder ?? "Selecciona una opción"}
            </option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </label>
    );
  }

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            GLOBALES
          </span>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-black">
            Predicciones globales
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Define manualmente las respuestas oficiales, revisa qué predijo cada
            usuario y calcula o resetea los puntos globales.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShowAllPredictions}
            disabled={isBusy || initialData.predictions.length === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-black transition hover:border-[#2A398D]/30 hover:text-[#2A398D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UsersRound className="h-4 w-4" />
            Ver usuarios
          </button>

          <button
            type="button"
            onClick={handleSaveResult}
            disabled={isBusy || !hasUnsavedChanges}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2A398D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1f2b6c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar respuestas
          </button>

          <button
            type="button"
            onClick={handleCalculatePoints}
            disabled={!canCalculate}
            title={
              hasUnsavedChanges
                ? "Guarda los cambios antes de calcular"
                : undefined
            }
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCalculating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            {hasStalePoints || isFullyCalculated ? "Recalcular" : "Calcular"}
          </button>

          <button
            type="button"
            onClick={handleResetPoints}
            disabled={isBusy || calculatedPredictions === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Resetear
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Respuestas oficiales"
          value={`${resolvedFields}/12`}
          tone={resolvedFields === 12 ? "success" : "neutral"}
        />
        <SummaryCard
          label="Usuarios con predicción"
          value={String(initialData.predictions.length)}
          tone="neutral"
        />
        <SummaryCard
          label="Predicciones calculadas"
          value={`${currentCalculatedPredictions}/${initialData.predictions.length}`}
          tone={
            isFullyCalculated
              ? "success"
              : hasStalePoints
                ? "warning"
                : "neutral"
          }
        />
        <SummaryCard
          label="Puntos globales repartidos"
          value={String(totalAwardedPoints)}
          tone="neutral"
        />
      </div>

      {hasUnsavedChanges || hasStalePoints || isFullyCalculated ? (
        <div
          className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${
            hasUnsavedChanges
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : hasStalePoints
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {hasUnsavedChanges ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Hay cambios sin guardar. Guarda las respuestas oficiales antes
                de calcular puntos.
              </p>
            </div>
          ) : hasStalePoints ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Los puntos existentes están desactualizados respecto a las
                respuestas oficiales actuales. Recalcula para actualizar la
                clasificación.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Los puntos globales están calculados con las respuestas
                actuales.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <ResultSection
            badge="MUNDIAL"
            title="Respuestas oficiales del torneo"
            fields={generalFields}
            renderField={renderResultField}
          />

          <ResultSection
            badge="ESPAÑA"
            title="Respuestas oficiales de España"
            fields={spainFields}
            renderField={renderResultField}
          />
        </section>

        <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/60">
                RESUMEN
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-black">
                Estado por predicción
              </h3>
              <p className="mt-1 text-sm text-black/55">
                Abre una predicción para ver usuario por usuario qué respondió.
              </p>
            </div>
            <div className="hidden rounded-2xl bg-[#2A398D]/10 p-3 text-[#2A398D] sm:block">
              <Trophy className="h-6 w-6" />
            </div>
          </div>

          <div className="grid gap-3">
            {fieldStats.map((stats) => (
              <FieldStatsCard
                key={stats.field.name}
                stats={stats}
                totalPredictions={initialData.predictions.length}
                points={getFieldPoints(stats.field, scoringRules)}
                isFullyCalculated={isFullyCalculated}
                hasStalePoints={hasStalePoints}
                onView={() => handleShowFieldPredictions(stats)}
              />
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-black/5 bg-white text-black";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-bold tracking-wide uppercase opacity-60">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function ResultSection({
  badge,
  title,
  fields,
  renderField,
}: {
  badge: string;
  title: string;
  fields: TournamentPredictionFieldConfig[];
  renderField: (field: TournamentPredictionFieldConfig) => ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
          {badge}
        </span>
        <h3 className="mt-3 text-lg font-extrabold text-black">{title}</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => renderField(field))}
      </div>
    </section>
  );
}

function FieldStatsCard({
  stats,
  totalPredictions,
  points,
  isFullyCalculated,
  hasStalePoints,
  onView,
}: {
  stats: FieldStats;
  totalPredictions: number;
  points: number;
  isFullyCalculated: boolean;
  hasStalePoints: boolean;
  onView: () => void;
}) {
  const statusText = !stats.isResolved
    ? "Sin respuesta oficial"
    : isFullyCalculated
      ? "Calculada"
      : hasStalePoints
        ? "Desactualizada"
        : "Pendiente de cálculo";
  const statusClass = !stats.isResolved
    ? "bg-black/5 text-black/50"
    : isFullyCalculated
      ? "bg-emerald-100 text-emerald-700"
      : hasStalePoints
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  return (
    <div className="rounded-2xl border border-black/5 bg-black/3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-black">
            {stats.field.label}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass}`}
            >
              {statusText}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black/60">
              {formatPoints(points)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          disabled={totalPredictions === 0}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black transition hover:border-[#2A398D]/30 hover:text-[#2A398D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-4 w-4" />
          Ver usuarios
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric
          label="Respondidas"
          value={`${stats.answeredCount}/${totalPredictions}`}
        />
        <Metric
          label={isFullyCalculated ? "Acertadas" : "Acertarían"}
          value={String(
            isFullyCalculated ? stats.correctCount : stats.previewCorrectCount,
          )}
        />
        <Metric label="Puntos" value={String(stats.awardedPoints)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-base font-extrabold text-black">{value}</p>
    </div>
  );
}

function FieldPredictionsModal({
  stats,
  predictions,
  result,
  teamsById,
  currentProcessedKey,
  previewBreakdowns,
}: {
  stats: FieldStats;
  predictions: AdminTournamentPrediction[];
  result: TournamentResult | null;
  teamsById: Map<number, Team>;
  currentProcessedKey: string;
  previewBreakdowns: Map<number, TournamentPredictionPointsBreakdown>;
}) {
  const officialValue = result
    ? formatFieldValue(
        stats.field,
        getFieldValue(result, stats.field.name),
        teamsById,
      )
    : "Sin respuesta";

  return (
    <div className="text-left">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ModalSummary label="Respuesta oficial" value={officialValue} />
        <ModalSummary
          label="Respondidas"
          value={`${stats.answeredCount}/${predictions.length}`}
        />
        <ModalSummary
          label="Acertarían"
          value={String(stats.previewCorrectCount)}
        />
      </div>

      {predictions.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-black/3 p-5 text-sm font-semibold text-black/45">
          No hay usuarios con predicciones globales guardadas.
        </div>
      ) : (
        <div className="max-h-[62vh] overflow-auto rounded-2xl border border-black/5">
          <table className="min-w-full divide-y divide-black/5 text-sm">
            <thead className="sticky top-0 bg-black/5 text-[11px] font-bold tracking-wide text-black/55 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Predicción</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {predictions.map((prediction) => {
                const currentBreakdown =
                  prediction.breakdown?.processedKey === currentProcessedKey
                    ? prediction.breakdown
                    : null;
                const fieldBreakdown =
                  currentBreakdown?.fields[stats.field.name] ??
                  previewBreakdowns.get(prediction.id)?.fields[
                    stats.field.name
                  ] ??
                  null;
                const predictionValue = formatFieldValue(
                  stats.field,
                  getFieldValue(prediction, stats.field.name),
                  teamsById,
                );
                const status = getFieldStatusLabel(
                  fieldBreakdown,
                  Boolean(currentBreakdown),
                );

                return (
                  <tr key={prediction.id}>
                    <td className="px-4 py-3 font-bold text-black">
                      {prediction.full_name || "Usuario sin nombre"}
                    </td>
                    <td className="px-4 py-3 text-black/70">
                      {predictionValue}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-black">
                      {currentBreakdown ? (fieldBreakdown?.points ?? 0) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AllPredictionsModal({
  predictions,
  teamsById,
  currentProcessedKey,
}: {
  predictions: AdminTournamentPrediction[];
  teamsById: Map<number, Team>;
  currentProcessedKey: string;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto text-left">
      {predictions.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-black/3 p-5 text-sm font-semibold text-black/45">
          No hay usuarios con predicciones globales guardadas.
        </div>
      ) : (
        <div className="grid gap-4">
          {predictions.map((prediction) => {
            const currentBreakdown =
              prediction.breakdown?.processedKey === currentProcessedKey
                ? prediction.breakdown
                : null;
            const completedFields = TOURNAMENT_PREDICTION_FIELDS.filter(
              (field) => !isEmptyValue(getFieldValue(prediction, field.name)),
            ).length;

            return (
              <article
                key={prediction.id}
                className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-black">
                      {prediction.full_name || "Usuario sin nombre"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-black/45">
                      {completedFields}/12 respuestas guardadas
                    </p>
                  </div>
                  <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold text-[#2A398D]">
                    {currentBreakdown
                      ? `${prediction.points ?? 0} pts`
                      : "Sin calcular"}
                  </span>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {TOURNAMENT_PREDICTION_FIELDS.map((field) => (
                    <div key={field.name} className="rounded-xl bg-black/3 p-3">
                      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
                        {field.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-black">
                        {formatFieldValue(
                          field,
                          getFieldValue(prediction, field.name),
                          teamsById,
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModalSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/3 p-4">
      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-black">{value}</p>
    </div>
  );
}

function getFieldStatusLabel(
  fieldBreakdown: TournamentPredictionFieldBreakdown | null | undefined,
  isCurrentCalculated: boolean,
) {
  if (!fieldBreakdown?.isResolved) {
    return {
      label: "Pendiente oficial",
      className: "bg-black/5 text-black/50",
    };
  }

  if (!fieldBreakdown.isAnswered) {
    return {
      label: "Sin respuesta",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (fieldBreakdown.isCorrect) {
    return {
      label: isCurrentCalculated ? "Correcta" : "Correcta previa",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: isCurrentCalculated ? "Incorrecta" : "Incorrecta previa",
    className: "bg-red-100 text-red-700",
  };
}

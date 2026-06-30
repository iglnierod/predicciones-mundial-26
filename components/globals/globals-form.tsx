"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import TextField from "./text-field";
import TeamSelectField from "./team-select-field";
import OptionSelectField from "./option-select-field";
import { saveTournamentPredictions } from "@/app/(main)/globals/actions";
import type { ScoringRulesMap } from "@/lib/scoring/types";
import {
  TOURNAMENT_PREDICTION_FIELDS,
  type TournamentPredictionFieldConfig,
} from "@/lib/predictions/tournament-fields";
import {
  Team,
  TournamentPrediction,
  TournamentPredictionFormValues,
} from "@/types";
import Swal from "sweetalert2";

type Props = {
  userId: string;
  initialPrediction: TournamentPrediction | null;
  teams: Team[];
  isClosed: boolean;
  closeAt: string | null;
  scoringRules: ScoringRulesMap;
};

function getInitialValues(
  prediction: TournamentPrediction | null,
): TournamentPredictionFormValues {
  return {
    world_cup_winner_team_id: prediction?.world_cup_winner_team_id ?? null,
    top_scorer: prediction?.top_scorer ?? "",
    top_assist: prediction?.top_assist ?? "",
    hat_trick_player: prediction?.hat_trick_player ?? "",
    most_goals_in_a_match_team_id:
      prediction?.most_goals_in_a_match_team_id ?? null,
    how_many_penalty_shootouts: prediction?.how_many_penalty_shootouts ?? "",
    underdog_quarterfinal_team_id:
      prediction?.underdog_quarterfinal_team_id ?? null,
    spain_top_scorer: prediction?.spain_top_scorer ?? "",
    spain_top_assist: prediction?.spain_top_assist ?? "",
    spain_red_card_player: prediction?.spain_red_card_player ?? "",
    spain_round: prediction?.spain_round ?? "",
    spain_total_goals: prediction?.spain_total_goals ?? "",
  };
}

export default function GlobalsForm({
  userId,
  initialPrediction,
  teams,
  isClosed,
  closeAt,
  scoringRules,
}: Props) {
  const [formValues, setFormValues] = useState<TournamentPredictionFormValues>(
    getInitialValues(initialPrediction),
  );
  const [formClosed, setFormClosed] = useState(isClosed);
  const [isPending, startTransition] = useTransition();

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

  const closeAtText = useMemo(() => {
    if (!closeAt) return null;

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(closeAt));
  }, [closeAt]);

  useEffect(() => {
    if (!closeAt || formClosed) return;

    const delay = new Date(closeAt).getTime() - Date.now();

    const timeoutId = window.setTimeout(
      () => {
        setFormClosed(true);
      },
      Math.max(delay, 0),
    );

    return () => window.clearTimeout(timeoutId);
  }, [closeAt, formClosed]);

  function getTeamsWithoutTop10(teams: Team[]): Team[] {
    return teams.filter((team) => team.is_top10_ranking_fifa === false);
  }

  function updateField<K extends keyof TournamentPredictionFormValues>(
    name: K,
    value: TournamentPredictionFormValues[K],
  ) {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function formatPoints(points: number) {
    return points === 1 ? "1 pto" : `${points} pts`;
  }

  function renderFieldLabel(field: TournamentPredictionFieldConfig) {
    const points = scoringRules[field.scoringRuleKey] ?? field.points;

    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>{field.label}</span>
        {typeof points === "number" ? (
          <span className="text-xs font-semibold tracking-normal text-black/45">
            {formatPoints(points)}
          </span>
        ) : null}
      </span>
    );
  }

  function renderField(field: TournamentPredictionFieldConfig) {
    const value = formValues[field.name];

    if (field.type === "text") {
      return (
        <TextField
          key={field.name}
          label={renderFieldLabel(field)}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          disabled={formClosed}
          onChange={(newValue) =>
            updateField(
              field.name,
              newValue as TournamentPredictionFormValues[typeof field.name],
            )
          }
        />
      );
    }

    if (field.type === "team-select") {
      return (
        <TeamSelectField
          key={field.name}
          label={renderFieldLabel(field)}
          value={typeof value === "number" ? value : null}
          teams={field.top10 ? getTeamsWithoutTop10(teams) : teams}
          placeholder={field.placeholder}
          disabled={formClosed}
          onChange={(newValue) =>
            updateField(
              field.name,
              newValue as TournamentPredictionFormValues[typeof field.name],
            )
          }
        />
      );
    }

    return (
      <OptionSelectField
        key={field.name}
        label={renderFieldLabel(field)}
        value={typeof value === "string" ? value : ""}
        options={field.options}
        placeholder={field.placeholder}
        disabled={formClosed}
        onChange={(newValue) =>
          updateField(
            field.name,
            newValue as TournamentPredictionFormValues[typeof field.name],
          )
        }
      />
    );
  }

  function handleSubmit() {
    if (formClosed) {
      void Swal.fire({
        position: "bottom-right",
        toast: true,
        icon: "error",
        text: "Las predicciones globales están cerradas.",
        timer: 2500,
        timerProgressBar: true,
        showCloseButton: true,
        showConfirmButton: false,
        width: 500,
      });
      return;
    }

    startTransition(async () => {
      const result = await saveTournamentPredictions({
        userId,
        values: formValues,
      });

      if (!result.success) {
        void Swal.fire({
          position: "bottom-right",
          toast: true,
          icon: "error",
          text: `Error guardando las predicciones. ${result.error ?? ""}`,
          timer: 2500,
          timerProgressBar: true,
          showCloseButton: true,
          showConfirmButton: false,
          width: 500,
        });
        return;
      }

      void Swal.fire({
        position: "bottom-end",
        toast: true,
        icon: "success",
        text: `Se han guardado tus predicciones`,
        timer: 2500,
        timerProgressBar: true,
        showCloseButton: true,
        showConfirmButton: false,
        width: 500,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`rounded-3xl border p-4 shadow-sm ${
          formClosed
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-[#2A398D]/10 bg-white/85 text-black/70"
        }`}
      >
        <p className="text-sm font-bold">
          {formClosed
            ? "Las predicciones globales están cerradas."
            : "Las predicciones globales siguen abiertas."}
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

      <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
              MUNDIAL
            </div>

            <h2 className="text-xl font-extrabold tracking-wide text-black">
              Predicciones globales
            </h2>
            <p className="mt-1 text-sm font-medium text-black/55">
              Completa tus predicciones generales del torneo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {generalFields.map((field) => renderField(field))}
        </div>
      </article>

      <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
              ESPAÑA
            </div>

            <h2 className="text-xl font-extrabold tracking-wide text-black">
              Predicciones de España
            </h2>
            <p className="mt-1 text-sm font-medium text-black/55">
              Completa las predicciones específicas sobre la selección española.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {spainFields.map((field) => renderField(field))}
        </div>
      </article>

      <div className="flex justify-center sm:justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || formClosed}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#2A398D] px-6 py-4 text-sm font-bold text-white transition hover:bg-white/80 hover:text-[#2A398D] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {formClosed ? (
            "PREDICCIONES CERRADAS"
          ) : isPending ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              GUARDANDO...
            </>
          ) : (
            "GUARDAR PREDICCIONES"
          )}
        </button>
      </div>
    </div>
  );
}

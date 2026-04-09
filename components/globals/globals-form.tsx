"use client";

import { useMemo, useState, useTransition } from "react";
import { LoaderCircle, Globe2, Shield } from "lucide-react";
import TextField from "./text-field";
import TeamSelectField from "./team-select-field";
import OptionSelectField from "./option-select-field";
import { saveTournamentPredictions } from "@/app/(main)/globals/actions";
import { Team } from "@/types";
import Swal from "sweetalert2";

type TournamentPrediction = {
  id: number;
  user_id: string;
  world_cup_winner_team_id: number | null;
  top_scorer: string | null;
  top_assist: string | null;
  hat_trick_player: string | null;
  most_goals_in_a_match_team_id: number | null;
  how_many_penalty_shootouts: string | null;
  underdog_quarterfinal_team_id: number | null;
  spain_top_scorer: string | null;
  spain_top_assist: string | null;
  spain_red_card_player: string | null;
  spain_round: string | null;
  spain_total_goals: string | null;
};

type FormValues = {
  world_cup_winner_team_id: number | null;
  top_scorer: string;
  top_assist: string;
  hat_trick_player: string;
  most_goals_in_a_match_team_id: number | null;
  how_many_penalty_shootouts: string;
  underdog_quarterfinal_team_id: number | null;
  spain_top_scorer: string;
  spain_top_assist: string;
  spain_red_card_player: string;
  spain_round: string;
  spain_total_goals: string;
};

type FieldConfig =
  | {
      name: keyof FormValues;
      label: string;
      type: "text";
      placeholder?: string;
      section: "general" | "spain";
    }
  | {
      name: keyof FormValues;
      label: string;
      type: "team-select";
      placeholder?: string;
      section: "general" | "spain";
    }
  | {
      name: keyof FormValues;
      label: string;
      type: "select";
      placeholder?: string;
      section: "general" | "spain";
      options: { value: string; label: string }[];
    };

type Props = {
  userId: string;
  initialPrediction: TournamentPrediction | null;
  teams: Team[];
};

const FIELD_CONFIG: FieldConfig[] = [
  {
    name: "world_cup_winner_team_id",
    label: "Campeón del Mundial",
    type: "team-select",
    section: "general",
    placeholder: "Selecciona el campeón",
  },
  {
    name: "top_scorer",
    label: "Máximo goleador del Mundial",
    type: "text",
    section: "general",
    placeholder: "Ej. Mbappé",
  },
  {
    name: "top_assist",
    label: "Máximo asistente del Mundial",
    type: "text",
    section: "general",
    placeholder: "Ej. Bellingham",
  },
  {
    name: "hat_trick_player",
    label: "Jugador que hará un hat-trick",
    type: "text",
    section: "general",
    placeholder: "Ej. Lautaro Martínez",
  },
  {
    name: "most_goals_in_a_match_team_id",
    label: "Selección con más goles en un partido",
    type: "team-select",
    section: "general",
    placeholder: "Selecciona un equipo",
  },
  {
    name: "how_many_penalty_shootouts",
    label: "¿Cuántas tandas de penaltis habrá?",
    type: "select",
    section: "general",
    placeholder: "Selecciona un rango",
    options: [
      { value: "0-1", label: "0-1" },
      { value: "2-3", label: "2-3" },
      { value: "4-5", label: "4-5" },
      { value: "6+", label: "6 o más" },
    ],
  },
  {
    name: "underdog_quarterfinal_team_id",
    label: "Selección sorpresa en cuartos",
    type: "team-select",
    section: "general",
    placeholder: "Selecciona un equipo",
  },
  {
    name: "spain_top_scorer",
    label: "Máximo goleador de España",
    type: "text",
    section: "spain",
    placeholder: "Ej. Morata",
  },
  {
    name: "spain_top_assist",
    label: "Máximo asistente de España",
    type: "text",
    section: "spain",
    placeholder: "Ej. Lamine Yamal",
  },
  {
    name: "spain_red_card_player",
    label: "Jugador de España expulsado",
    type: "text",
    section: "spain",
    placeholder: "Ej. Carvajal",
  },
  {
    name: "spain_round",
    label: "¿Hasta qué ronda llegará España?",
    type: "select",
    section: "spain",
    placeholder: "Selecciona una ronda",
    options: [
      { value: "group", label: "Fase de grupos" },
      { value: "R32", label: "Dieciseisavos" },
      { value: "R16", label: "Octavos" },
      { value: "QF", label: "Cuartos" },
      { value: "SF", label: "Semifinales" },
      { value: "final", label: "Final" },
    ],
  },
  {
    name: "spain_total_goals",
    label: "¿Cuántos goles marcará España?",
    type: "select",
    section: "spain",
    placeholder: "Selecciona un rango",
    options: [
      { value: "0-3", label: "0-3" },
      { value: "4-6", label: "4-6" },
      { value: "7-9", label: "7-9" },
      { value: "10+", label: "10 o más" },
    ],
  },
];

function getInitialValues(prediction: TournamentPrediction | null): FormValues {
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
}: Props) {
  const [formValues, setFormValues] = useState<FormValues>(
    getInitialValues(initialPrediction),
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const generalFields = useMemo(
    () => FIELD_CONFIG.filter((field) => field.section === "general"),
    [],
  );

  const spainFields = useMemo(
    () => FIELD_CONFIG.filter((field) => field.section === "spain"),
    [],
  );

  function updateField<K extends keyof FormValues>(
    name: K,
    value: FormValues[K],
  ) {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function renderField(field: FieldConfig) {
    const value = formValues[field.name];

    if (field.type === "text") {
      return (
        <TextField
          key={field.name}
          label={field.label}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(newValue) =>
            updateField(field.name, newValue as FormValues[typeof field.name])
          }
        />
      );
    }

    if (field.type === "team-select") {
      return (
        <TeamSelectField
          key={field.name}
          label={field.label}
          value={typeof value === "number" ? value : null}
          teams={teams}
          placeholder={field.placeholder}
          onChange={(newValue) =>
            updateField(field.name, newValue as FormValues[typeof field.name])
          }
        />
      );
    }

    return (
      <OptionSelectField
        key={field.name}
        label={field.label}
        value={typeof value === "string" ? value : ""}
        options={field.options}
        placeholder={field.placeholder}
        onChange={(newValue) =>
          updateField(field.name, newValue as FormValues[typeof field.name])
        }
      />
    );
  }

  function handleSubmit() {
    setFeedback(null);

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
      <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
              <Globe2 className="h-3.5 w-3.5" />
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
              <Shield className="h-3.5 w-3.5" />
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
          disabled={isPending}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#2A398D] px-6 py-4 text-sm font-bold text-white transition hover:bg-white/80 hover:text-[#2A398D] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
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

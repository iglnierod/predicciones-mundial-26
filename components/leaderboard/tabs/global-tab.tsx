"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import {
  loadLeaderboardGlobalBreakdown,
  type LeaderboardGlobalTeam,
  type LeaderboardGlobalTeamsById,
} from "@/app/(main)/leaderboard/actions";
import { LeaderboardProfile, TournamentPrediction } from "@/types";

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
};

type PredictionField = {
  label: string;
  value: string | null;
  team?: LeaderboardGlobalTeam | null;
};

const SPAIN_ROUND_LABELS: Record<string, string> = {
  group: "Fase de grupos",
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinales",
  final: "Final",
};

function formatTextValue(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null;
}

function formatSpainRound(value: string | null | undefined) {
  const textValue = formatTextValue(value);

  return textValue ? (SPAIN_ROUND_LABELS[textValue] ?? textValue) : null;
}

function getTeam(
  teamId: number | null | undefined,
  teamsById: LeaderboardGlobalTeamsById,
) {
  return typeof teamId === "number" ? (teamsById[teamId] ?? null) : null;
}

function countCompletedFields(fields: PredictionField[]) {
  return fields.filter((field) => field.team || field.value).length;
}

export default function GlobalTab({ profile, viewerUserId }: Props) {
  const [prediction, setPrediction] = useState<TournamentPrediction | null>(
    null,
  );
  const [teamsById, setTeamsById] = useState<LeaderboardGlobalTeamsById>({});
  const [loading, setLoading] = useState(Boolean(viewerUserId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalPredictions() {
      try {
        setLoading(true);
        setError(null);

        const result = await loadLeaderboardGlobalBreakdown(profile.user_id);

        if (!result.success) {
          throw new Error(
            result.error ?? "No se pudieron cargar las predicciones globales",
          );
        }

        if (!isMounted) return;

        setPrediction(result.prediction);
        setTeamsById(result.teamsById);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Se produjo un error al cargar las predicciones globales",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!viewerUserId) {
      return;
    }

    fetchGlobalPredictions();

    return () => {
      isMounted = false;
    };
  }, [profile.user_id, viewerUserId]);

  const generalFields = useMemo<PredictionField[]>(
    () => [
      {
        label: "Campeón del Mundial",
        value: null,
        team: getTeam(prediction?.world_cup_winner_team_id, teamsById),
      },
      {
        label: "Máximo goleador del Mundial",
        value: formatTextValue(prediction?.top_scorer),
      },
      {
        label: "Máximo asistente del Mundial",
        value: formatTextValue(prediction?.top_assist),
      },
      {
        label: "Jugador que hará un hat-trick",
        value: formatTextValue(prediction?.hat_trick_player),
      },
      {
        label: "Selección con más goles en un partido",
        value: null,
        team: getTeam(prediction?.most_goals_in_a_match_team_id, teamsById),
      },
      {
        label: "Tandas de penaltis",
        value: formatTextValue(prediction?.how_many_penalty_shootouts),
      },
      {
        label: "Sorpresa en cuartos",
        value: null,
        team: getTeam(prediction?.underdog_quarterfinal_team_id, teamsById),
      },
    ],
    [prediction, teamsById],
  );

  const spainFields = useMemo<PredictionField[]>(
    () => [
      {
        label: "Máximo goleador de España",
        value: formatTextValue(prediction?.spain_top_scorer),
      },
      {
        label: "Máximo asistente de España",
        value: formatTextValue(prediction?.spain_top_assist),
      },
      {
        label: "Expulsado de España",
        value: formatTextValue(prediction?.spain_red_card_player),
      },
      {
        label: "Ronda de España",
        value: formatSpainRound(prediction?.spain_round),
      },
      {
        label: "Goles totales de España",
        value: formatTextValue(prediction?.spain_total_goals),
      },
    ],
    [prediction],
  );

  const completedPredictions = countCompletedFields([
    ...generalFields,
    ...spainFields,
  ]);
  const accessError = viewerUserId
    ? error
    : "Debes iniciar sesión para ver estas predicciones.";

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            GLOBALES
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {profile.tournament_points} puntos globales
          </span>

          {!loading && !accessError && prediction && (
            <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
              {completedPredictions}/12 predicciones
            </span>
          )}
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Predicciones globales
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Resumen de las predicciones del torneo de{" "}
          <span className="font-semibold text-black">
            {profile.full_name ?? "este usuario"}
          </span>
          .
        </p>
      </section>

      {loading ? (
        <GlobalTabSkeleton />
      ) : accessError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">No se pudieron cargar las globales</p>
              <p className="mt-1 text-sm">{accessError}</p>
            </div>
          </div>
        </div>
      ) : !prediction ? (
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-sm text-black/60">
            Este usuario todavía no tiene predicciones globales guardadas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <PredictionSection
            badge="MUNDIAL"
            title="Predicciones del torneo"
            fields={generalFields}
          />
          <PredictionSection
            badge="ESPAÑA"
            title="Predicciones de España"
            fields={spainFields}
          />
        </div>
      )}
    </div>
  );
}

function PredictionSection({
  badge,
  title,
  fields,
}: {
  badge: string;
  title: string;
  fields: PredictionField[];
}) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-4">
        <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
          {badge}
        </span>

        <h4 className="mt-3 text-base font-extrabold text-black">{title}</h4>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {fields.map((field) => (
          <PredictionCard key={field.label} field={field} />
        ))}
      </div>
    </article>
  );
}

function PredictionCard({ field }: { field: PredictionField }) {
  const hasPrediction = Boolean(field.team || field.value);

  return (
    <div
      className={
        hasPrediction
          ? "rounded-2xl border border-[#2A398D]/10 bg-[#2A398D]/5 p-3 shadow-sm"
          : "rounded-2xl border border-black/5 bg-black/3 p-3"
      }
    >
      <p className="text-[11px] font-bold tracking-wide text-black/45 uppercase">
        {field.label}
      </p>

      <div className="mt-2">
        {field.team ? (
          <TeamValue team={field.team} />
        ) : (
          <p
            className={
              field.value
                ? "text-sm font-extrabold text-black"
                : "text-sm font-semibold text-black/35"
            }
          >
            {field.value ?? "Sin predicción"}
          </p>
        )}
      </div>
    </div>
  );
}

function TeamValue({ team }: { team: LeaderboardGlobalTeam }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
        <Image
          src={`https://flagcdn.com/w160/${team.flag_code}.png`}
          alt={`Bandera de ${team.name}`}
          width={44}
          height={30}
          className="h-7 w-11 object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-black">
          {team.name}
        </p>
        <p className="text-xs font-bold text-[#2A398D]">{team.code}</p>
      </div>
    </div>
  );
}

function GlobalTabSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm"
        >
          <div className="mb-4 h-6 w-24 animate-pulse rounded-full bg-[#2A398D]/10" />
          <div className="mb-4 h-5 w-44 animate-pulse rounded-full bg-black/5" />

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {Array.from({ length: sectionIndex === 0 ? 7 : 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/5 bg-black/3 p-3"
                >
                  <div className="mb-3 h-3 w-28 animate-pulse rounded-full bg-black/5" />
                  <div className="h-5 w-36 animate-pulse rounded-full bg-black/10" />
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

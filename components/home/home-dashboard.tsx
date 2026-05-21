import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { formatKickoffDateTime, getRoundLabel } from "@/lib/format/match";
import type {
  HomeMatch,
  HomePredictionStatus,
  LastPlayedMatch,
  LeaderboardEvolutionSeries,
} from "@/lib/repositories/home-repository";
import LeaderboardEvolutionChart from "./leaderboard-evolution-chart";

type Props = {
  predictionStatus: HomePredictionStatus;
  upcomingMatches: HomeMatch[];
  lastPlayedMatch: LastPlayedMatch | null;
  leaderboardSeries: LeaderboardEvolutionSeries[];
};

function TeamFlag({
  flagCode,
  name,
}: {
  flagCode: string | null;
  name: string;
}) {
  return (
    <div className="overflow-hidden rounded-tl-xl rounded-br-xl border border-black/5 bg-white shadow-sm">
      <Image
        src={`https://flagcdn.com/w160/${flagCode ?? "un"}.png`}
        alt={`Bandera de ${name}`}
        width={48}
        height={32}
        className="h-8 w-12 object-cover"
      />
    </div>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      COMPLETO
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-700">
      <AlertTriangle className="h-3.5 w-3.5" />
      PENDIENTE
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 inline-flex rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-black">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
          {description}
        </p>
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-3 text-[#2A398D] shadow-sm">
        {icon}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white p-6 text-center text-sm text-black/60 shadow-sm">
      {children}
    </div>
  );
}

function ProgressTile({
  title,
  value,
  detail,
  complete,
  href,
  actionLabel,
}: {
  title: string;
  value: ReactNode;
  detail: string;
  complete: boolean;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-black">{title}</h3>
        <StatusPill complete={complete} />
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-black">
        {value}
      </p>
      <p className="mt-1 text-sm text-black/60">{detail}</p>
      {!complete && (
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#22307c]"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PendingCard({
  predictionStatus,
}: {
  predictionStatus: HomePredictionStatus;
}) {
  const allComplete =
    predictionStatus.groups.isComplete &&
    predictionStatus.tournament.isComplete;

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="ACCIONES"
        title={allComplete ? "Todo listo" : "Pendientes importantes"}
        description={
          allComplete
            ? "No tienes bloques importantes por completar antes de la siguiente actualización."
            : "Termina estos apartados para que tus predicciones entren completas en el torneo."
        }
        icon={<Trophy className="h-6 w-6" />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ProgressTile
          title="Grupos"
          value={
            <>
              {predictionStatus.groups.predicted}
              <span className="text-lg font-extrabold text-black/35">
                /{predictionStatus.groups.total}
              </span>
            </>
          }
          detail="grupos predichos"
          complete={predictionStatus.groups.isComplete}
          href="/groups"
          actionLabel="Completar grupos"
        />

        <ProgressTile
          title="Globales"
          value={
            <>
              {predictionStatus.tournament.completed}
              <span className="text-lg font-extrabold text-black/35">
                /{predictionStatus.tournament.total}
              </span>
            </>
          }
          detail="campos completados"
          complete={predictionStatus.tournament.isComplete}
          href="/globals"
          actionLabel="Completar globales"
        />
      </div>
    </section>
  );
}

function UpcomingMatchesCard({ matches }: { matches: HomeMatch[] }) {
  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="CALENDARIO"
        title="Próximos partidos"
        description="Los 3 siguientes partidos y el estado de tu predicción."
        icon={<CalendarClock className="h-6 w-6" />}
      />

      {matches.length === 0 ? (
        <EmptyState>No hay próximos partidos cargados.</EmptyState>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const hasPrediction =
              match.predicted_home_score !== null &&
              match.predicted_away_score !== null;
            const homeName = match.home_team_name ?? "Equipo local";
            const awayName = match.away_team_name ?? "Equipo visitante";

            return (
              <div
                key={match.id}
                className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
                    {getRoundLabel(match.round)}
                    {match.group_name ? ` · ${match.group_name}` : ""}
                  </span>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/60">
                    {formatKickoffDateTime(match.kickoff_at)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex items-center justify-end gap-2 text-right">
                    <span className="truncate text-sm font-extrabold">
                      {match.home_team_code ?? "LOC"}
                    </span>
                    <TeamFlag
                      flagCode={match.home_team_flag_code}
                      name={homeName}
                    />
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-white px-3 py-2 text-center font-extrabold text-black/70 shadow-sm">
                    VS
                  </div>

                  <div className="flex items-center gap-2">
                    <TeamFlag
                      flagCode={match.away_team_flag_code}
                      name={awayName}
                    />
                    <span className="truncate text-sm font-extrabold">
                      {match.away_team_code ?? "VIS"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {hasPrediction ? (
                    <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Tu predicción: {match.predicted_home_score} -{" "}
                      {match.predicted_away_score}
                    </p>
                  ) : (
                    <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      Sin predicción todavía
                    </p>
                  )}

                  {!hasPrediction && (
                    <Link
                      href="/matches"
                      className="rounded-2xl bg-[#2A398D] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#22307c]"
                    >
                      Predecir
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getRuleLabel(ruleKey: string | null | undefined) {
  switch (ruleKey) {
    case "match_exact_score":
      return "Resultado exacto";
    case "match_winner_and_difference":
      return "Ganador y diferencia";
    case "match_winner_only":
      return "Ganador";
    case "match_one_team_goals":
      return "Goles de un equipo";
    default:
      return "Sin regla aplicada";
  }
}

function LastPlayedMatchCard({ match }: { match: LastPlayedMatch | null }) {
  if (!match) {
    return (
      <section className="space-y-5">
        <SectionHeader
          eyebrow="RESULTADO"
          title="Último partido jugado"
          description="Aquí aparecerá el marcador final y tus puntos cuando haya partidos cerrados."
          icon={<Clock className="h-6 w-6" />}
        />
        <EmptyState>Todavía no hay partidos finalizados.</EmptyState>
      </section>
    );
  }

  const homeName = match.home_team_name ?? "Equipo local";
  const awayName = match.away_team_name ?? "Equipo visitante";
  const isCalculated = Boolean(match.points_calculated_at);
  const hasPrediction =
    match.predicted_home_score !== null && match.predicted_away_score !== null;

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="RESULTADO"
        title="Último partido jugado"
        description={formatKickoffDateTime(match.kickoff_at, {
          year: "numeric",
        })}
        icon={
          isCalculated ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          ) : (
            <Clock className="h-6 w-6 text-amber-700" />
          )
        }
      />

      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="truncate text-base font-extrabold">
              {match.home_team_code ?? "LOC"}
            </span>
            <TeamFlag flagCode={match.home_team_flag_code} name={homeName} />
          </div>

          <div className="rounded-2xl bg-[#2A398D] px-4 py-2 text-center text-2xl font-extrabold text-white shadow-sm">
            {match.home_score} - {match.away_score}
          </div>

          <div className="flex items-center gap-2">
            <TeamFlag flagCode={match.away_team_flag_code} name={awayName} />
            <span className="truncate text-base font-extrabold">
              {match.away_team_code ?? "VIS"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        {isCalculated ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-black/60">
                Estado de cálculo
              </p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                Calculado
              </span>
            </div>

            {hasPrediction ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-black/45">
                    Tu predicción
                  </p>
                  <p className="mt-1 text-lg font-extrabold">
                    {match.predicted_home_score} - {match.predicted_away_score}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-black/45">Puntos</p>
                  <p className="mt-1 text-lg font-extrabold text-[#2A398D]">
                    {match.user_points ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-black/45">Desglose</p>
                  <p className="mt-1 text-sm font-extrabold">
                    {getRuleLabel(match.user_breakdown?.ruleKey)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-black/60">
                No tenías predicción para este partido, así que no hay desglose.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-start gap-3 text-amber-800">
            <Clock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Pendiente de calcular</p>
              <p className="mt-1 text-sm text-black/60">
                El resultado ya está cargado, pero los puntos de este partido
                todavía no se han calculado.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LeaderboardEvolutionCard({
  series,
}: {
  series: LeaderboardEvolutionSeries[];
}) {
  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="HISTÓRICO"
        title="Evolución de la clasificación"
        description="Posición por snapshot. La línea azul marca tu evolución."
        icon={<Medal className="h-6 w-6" />}
      />

      <div className="flex flex-wrap gap-2">
        {series.map((item) => (
          <span
            key={item.userId}
            className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-bold text-black/65 shadow-sm"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
        ))}
      </div>

      <LeaderboardEvolutionChart series={series} />
    </section>
  );
}

export default function HomeDashboard({
  predictionStatus,
  upcomingMatches,
  lastPlayedMatch,
  leaderboardSeries,
}: Props) {
  const pendingCount =
    predictionStatus.groups.pending + predictionStatus.tournament.pending;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/85 p-4 text-black shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-6">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="mb-7 flex flex-col gap-4 border-b border-black/5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5" />
            PANEL DE CONTROL
          </p>
          <h2 className="text-3xl font-black tracking-tight text-black md:text-4xl">
            {pendingCount === 0
              ? "Todo listo para la próxima jornada"
              : "Tu Mundial, en una sola vista"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 md:text-base">
            Revisa pendientes, próximos partidos y cambios en la clasificación
            sin salir de este resumen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            {pendingCount === 0
              ? "Sin pendientes"
              : `${pendingCount} pendientes`}
          </span>
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-xs font-bold text-[#2A398D]">
            {upcomingMatches.length} próximos partidos
          </span>
        </div>
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-7">
          <PendingCard predictionStatus={predictionStatus} />
          <div className="border-t border-black/5 pt-7">
            <LastPlayedMatchCard match={lastPlayedMatch} />
          </div>
        </div>

        <div className="xl:border-l xl:border-black/5 xl:pl-7">
          <UpcomingMatchesCard matches={upcomingMatches} />
        </div>
      </div>

      <div className="mt-7 border-t border-black/5 pt-7">
        <LeaderboardEvolutionCard series={leaderboardSeries} />
      </div>
    </div>
  );
}

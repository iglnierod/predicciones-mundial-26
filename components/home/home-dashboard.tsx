import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatKickoffDateTime, getRoundLabel } from "@/lib/format/match";
import type {
  HomeMatch,
  HomePredictionStatus,
  HomeTournamentTiming,
  LastPlayedMatch,
  LeaderboardEvolutionSeries,
} from "@/lib/repositories/home-repository";
import HomeMatchCountdown from "./home-match-countdown";
import LeaderboardEvolutionChart from "./leaderboard-evolution-chart";

type Props = {
  predictionStatus: HomePredictionStatus;
  tournamentTiming: HomeTournamentTiming;
  upcomingMatches: HomeMatch[];
  lastPlayedMatches: LastPlayedMatch[];
  leaderboardSeries: LeaderboardEvolutionSeries[];
};

function TeamFlag({
  flagCode,
  name,
  large,
}: {
  flagCode: string | null;
  name: string;
  large?: boolean;
}) {
  // Default size matches previous usage across the app (48x32). When
  // `large` is provided we render a larger flag for the featured match.
  const width = large ? 64 : 48;
  const height = large ? 48 : 32;
  const className = large ? "h-12 w-16 object-cover" : "h-8 w-12 object-cover";

  return (
    <div className="w-fit shrink-0 overflow-hidden rounded-tl-xl rounded-br-xl border border-black/5 bg-white shadow-sm">
      <Image
        src={`https://flagcdn.com/w160/${flagCode?.toLowerCase() ?? "un"}.png`}
        alt={`Bandera de ${name}`}
        width={width}
        height={height}
        className={className}
      />
    </div>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      COMPLETO
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-700">
      <AlertTriangle className="h-3.5 w-3.5" />
      PENDIENTE
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="mb-2 inline-flex rounded-full bg-[#2A398D]/10 px-3 py-1 text-[10px] font-bold tracking-wide text-[#2A398D]">
        {eyebrow}
      </p>
      <h2 className="text-xl font-extrabold tracking-tight text-black md:text-2xl">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-5 text-black/60">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-4 text-center text-sm text-black/60 shadow-sm">
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
    <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-black">{title}</h3>
        <StatusPill complete={complete} />
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-black">
        {value}
      </p>
      <p className="text-xs text-black/60">{detail}</p>
      {!complete && (
        <Link
          href={href}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A398D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#22307c] md:w-auto"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
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
    <section className="space-y-3">
      <SectionHeader
        eyebrow="ACCIONES"
        title={allComplete ? "Todo listo" : "Pendientes importantes"}
        description={
          allComplete
            ? "No tienes bloques importantes por completar antes de la siguiente actualización."
            : "Termina estos apartados para que tus predicciones entren completas en el torneo."
        }
      />

      <div className="grid gap-2 sm:grid-cols-2">
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

function MatchPredictionAction({
  match,
  prominent = false,
}: {
  match: HomeMatch;
  prominent?: boolean;
}) {
  const hasPrediction =
    match.predicted_home_score !== null && match.predicted_away_score !== null;

  if (hasPrediction) {
    return (
      <p
        className={`rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700 ${
          prominent ? "text-sm" : "text-xs"
        }`}
      >
        Tu predicción: {match.predicted_home_score} -{" "}
        {match.predicted_away_score}
      </p>
    );
  }

  return (
    <Link
      href="/matches"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl font-bold transition sm:w-auto ${
        prominent
          ? "bg-white px-4 py-2 text-sm text-[#2A398D] hover:bg-white/90"
          : "bg-[#2A398D] px-4 py-2 text-xs text-white hover:bg-[#22307c]"
      }`}
    >
      Predecir
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function FeaturedUpcomingMatch({ match }: { match: HomeMatch }) {
  const homeName = match.home_team_name ?? "Equipo local";
  const awayName = match.away_team_name ?? "Equipo visitante";

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] bg-[#2A398D] p-4 text-white shadow-[0_18px_44px_rgba(42,57,141,0.28)] ring-1 ring-white/20">
      <div className="pointer-events-none absolute -top-24 right-6 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-black tracking-wide text-white/80 ring-1 ring-white/15">
            SIGUIENTE PARTIDO
          </span>
          <p className="mt-2 text-sm font-bold text-white/65">
            {getRoundLabel(match.round)}
            {match.group_name ? ` · ${match.group_name}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black tracking-wide text-[#2A398D]">
          {formatKickoffDateTime(match.kickoff_at, { year: "numeric" })}
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag
            flagCode={match.home_team_flag_code}
            name={homeName}
            large
          />
          <p className="max-w-full truncate text-xl font-black tracking-tight">
            {match.home_team_code ?? "LOC"}
          </p>
          <p className="max-w-full truncate text-xs font-bold text-white/65">
            {homeName}
          </p>
        </div>

        <div className="rounded-2xl bg-white/12 px-3 py-2 text-center text-base font-black text-white ring-1 ring-white/15">
          VS
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag
            flagCode={match.away_team_flag_code}
            name={awayName}
            large
          />
          <p className="max-w-full truncate text-xl font-black tracking-tight">
            {match.away_team_code ?? "VIS"}
          </p>
          <p className="max-w-full truncate text-xs font-bold text-white/65">
            {awayName}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <HomeMatchCountdown kickoffAt={match.kickoff_at} />
      </div>

      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-white/60">
          Cierre de predicción: justo antes del inicio.
        </p>
        <MatchPredictionAction match={match} prominent />
      </div>
    </article>
  );
}

function SecondaryUpcomingMatch({ match }: { match: HomeMatch }) {
  const hasPrediction =
    match.predicted_home_score !== null && match.predicted_away_score !== null;
  const homeName = match.home_team_name ?? "Equipo local";
  const awayName = match.away_team_name ?? "Equipo visitante";

  return (
    <article className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/55">
          {formatKickoffDateTime(match.kickoff_at)}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${
            hasPrediction
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {hasPrediction ? "Predicho" : "Pendiente"}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <TeamFlag flagCode={match.home_team_flag_code} name={homeName} />
          <span className="truncate text-sm font-extrabold">
            {match.home_team_code ?? "LOC"}
          </span>
        </div>

        <div className="rounded-xl border border-black/5 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold text-black/50 shadow-sm">
          VS
        </div>

        <div className="flex items-center justify-center gap-3 text-center">
          <TeamFlag flagCode={match.away_team_flag_code} name={awayName} />
          <span className="truncate text-sm font-extrabold">
            {match.away_team_code ?? "VIS"}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-black/45">
          {getRoundLabel(match.round)}
          {match.group_name ? ` · ${match.group_name}` : ""}
        </span>
        {!hasPrediction && <MatchPredictionAction match={match} />}
        {hasPrediction && (
          <span className="text-xs font-black text-emerald-700">
            {match.predicted_home_score} - {match.predicted_away_score}
          </span>
        )}
      </div>
    </article>
  );
}

function UpcomingMatchesCard({ matches }: { matches: HomeMatch[] }) {
  const [featuredMatch, ...secondaryMatches] = matches;

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="CALENDARIO"
        title="Próximos partidos"
        description="El siguiente partido en grande y los otros próximos en formato rápido."
      />

      {!featuredMatch ? (
        <EmptyState>No hay próximos partidos cargados.</EmptyState>
      ) : (
        <div className="space-y-2.5">
          <FeaturedUpcomingMatch match={featuredMatch} />
          {secondaryMatches.length > 0 && (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {secondaryMatches.map((match) => (
                <SecondaryUpcomingMatch key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CompletedMatchSummary({ match }: { match: LastPlayedMatch }) {
  const homeName = match.home_team_name ?? "Equipo local";
  const awayName = match.away_team_name ?? "Equipo visitante";
  const isCalculated = Boolean(match.points_calculated_at);
  const hasPrediction =
    match.predicted_home_score !== null && match.predicted_away_score !== null;

  return (
    <article className="relative flex flex-col rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between text-xs">
        <div className="flex flex-1 justify-start">
          <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
            {getRoundLabel(match.round)}
          </span>
        </div>
        <div className="flex flex-1 justify-center text-center text-[11px] font-bold tracking-wide text-black/45">
          {formatKickoffDateTime(match.kickoff_at, { year: "numeric" })}
        </div>
        <div className="flex flex-1 justify-end">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
              isCalculated
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isCalculated ? "Calculado" : "Pendiente"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamFlag flagCode={match.home_team_flag_code} name={homeName} />
          <span className="truncate text-sm font-extrabold text-black">
            {match.home_team_code ?? "LOC"}
          </span>
        </div>

        <div className="flex min-w-16 items-center justify-center rounded-xl bg-[#2A398D] px-3 py-1.5 text-lg font-black text-white shadow-sm">
          {match.home_score} - {match.away_score}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <TeamFlag flagCode={match.away_team_flag_code} name={awayName} />
          <span className="truncate text-sm font-extrabold text-black">
            {match.away_team_code ?? "VIS"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center justify-center rounded-xl bg-black/[0.035] py-2 text-center">
          <span className="text-[10px] font-black tracking-wide text-black/40">
            TU PREDICCIÓN
          </span>
          <span className="mt-0.5 text-sm font-bold text-black">
            {hasPrediction
              ? `${match.predicted_home_score} - ${match.predicted_away_score}`
              : "Sin predicción"}
          </span>
        </div>

        <div
          className={`flex flex-col items-center justify-center rounded-xl py-2 text-center ${
            isCalculated ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          <span
            className={`text-[10px] font-black tracking-wide ${
              isCalculated ? "text-emerald-800/60" : "text-amber-800/60"
            }`}
          >
            PUNTOS
          </span>
          <span
            className={`mt-0.5 text-sm font-bold ${
              isCalculated ? "text-emerald-800" : "text-amber-800"
            }`}
          >
            {isCalculated && hasPrediction
              ? `${match.user_points ?? 0} pts`
              : isCalculated
                ? "0 pts"
                : "Pendiente"}
          </span>
        </div>
      </div>
    </article>
  );
}

function CompletedMatchesCard({ matches }: { matches: LastPlayedMatch[] }) {
  if (matches.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader
          eyebrow="RESULTADO"
          title="Últimos resultados"
          description="Aquí aparecerán los últimos marcadores y tus puntos cuando haya partidos cerrados."
        />
        <EmptyState>Todavía no hay partidos finalizados.</EmptyState>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="RESULTADO"
        title="Últimos resultados"
        description="Los 2 partidos más recientes ya jugados, con tu predicción y puntos."
      />

      <div className="space-y-2.5">
        {matches.map((match) => (
          <CompletedMatchSummary key={match.id} match={match} />
        ))}
      </div>

      <Link
        href="/matches?tab=played"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#22307c]"
      >
        Ver resultados y predicciones de otros usuarios
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function LeaderboardEvolutionCard({
  series,
}: {
  series: LeaderboardEvolutionSeries[];
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="HISTÓRICO"
        title="Evolución de la clasificación"
        description="Posición por snapshot para todos los usuarios. La línea azul marca tu evolución."
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

      <div className="mt-2 flex items-center justify-end">
        <Link
          href="/leaderboard"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A398D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#22307c] md:w-auto md:px-3 md:py-1.5"
        >
          Ver clasificación completa
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default function HomeDashboard({
  predictionStatus,
  tournamentTiming,
  upcomingMatches,
  lastPlayedMatches,
  leaderboardSeries,
}: Props) {
  const showPendingCard = !tournamentTiming.hasStarted;

  const missingMatchPredictionsCount = upcomingMatches.filter(
    (m) => m.predicted_home_score === null || m.predicted_away_score === null,
  ).length;

  return (
    <div className="space-y-5">
      {showPendingCard && (
        <div className="relative overflow-hidden rounded-4xl border border-black/5 bg-white/85 p-4 text-black shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-5">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent" />
          <PendingCard predictionStatus={predictionStatus} />
        </div>
      )}

      <div className="relative overflow-hidden rounded-4xl border border-black/5 bg-white/85 p-4 text-black shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent" />

        <div className="mb-5 flex flex-col gap-4 border-b border-black/5 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
              <Sparkles className="h-3.5 w-3.5" />
              PANEL PRINCIPAL
            </p>
            <h2 className="text-3xl font-black tracking-tight text-black md:text-4xl">
              Resumen del torneo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 md:text-base">
              Próximos partidos, últimos resultados y evolución en la
              clasificación.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {missingMatchPredictionsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {missingMatchPredictionsCount}{" "}
                {missingMatchPredictionsCount === 1
                  ? "partido pendiente"
                  : "partidos pendientes"}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <UpcomingMatchesCard matches={upcomingMatches} />
          <div className="xl:border-l xl:border-black/5 xl:pl-7">
            <CompletedMatchesCard matches={lastPlayedMatches} />
          </div>
        </div>

        <div className="mt-5 border-t border-black/5 pt-5">
          <LeaderboardEvolutionCard series={leaderboardSeries} />
        </div>
      </div>
    </div>
  );
}

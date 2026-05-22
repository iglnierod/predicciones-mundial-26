import { SupabaseClient } from "@supabase/supabase-js";
import type { MatchPredictionBreakdown, MatchWithPrediction } from "@/types";

const TOURNAMENT_PREDICTION_FIELDS = [
  "world_cup_winner_team_id",
  "top_scorer",
  "top_assist",
  "hat_trick_player",
  "most_goals_in_a_match_team_id",
  "how_many_penalty_shootouts",
  "underdog_quarterfinal_team_id",
  "spain_top_scorer",
  "spain_top_assist",
  "spain_red_card_player",
  "spain_round",
  "spain_total_goals",
] as const;

type TournamentPredictionStatusRow = Record<
  (typeof TOURNAMENT_PREDICTION_FIELDS)[number],
  string | number | null
>;

export type HomePredictionStatus = {
  groups: {
    total: number;
    predicted: number;
    pending: number;
    isComplete: boolean;
  };
  tournament: {
    total: number;
    completed: number;
    pending: number;
    isComplete: boolean;
    hasPrediction: boolean;
  };
};

export type HomeTournamentTiming = {
  firstKickoffAt: string | null;
  hasStarted: boolean;
};

export type HomeMatch = MatchWithPrediction & {
  last_processed_key: string | null;
  points_calculated_at: string | null;
};

export type LastPlayedMatch = HomeMatch & {
  user_breakdown: MatchPredictionBreakdown | null;
  user_points: number | null;
  is_user_prediction_calculated: boolean;
};

export type LeaderboardEvolutionSeries = {
  userId: string;
  name: string;
  color: string;
  isCurrentUser: boolean;
  points: Array<{
    snapshotId: number;
    createdAt: string;
    label: string;
    rank: number;
    totalPoints: number;
  }>;
};

type SnapshotRow = {
  id: number;
  created_at: string;
};

type SnapshotEntryRow = {
  snapshot_id: number;
  user_id: string;
  rank: number;
  total_points: number;
};

type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  rank: number;
};

type MatchPredictionOverviewRow = {
  points: number | null;
  is_calculated: boolean;
  breakdown: MatchPredictionBreakdown | null;
};

function isCompletedPredictionValue(value: string | number | null) {
  if (typeof value === "number") return true;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function formatSnapshotLabel(createdAt: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(createdAt));
}

export async function getHomePredictionStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<HomePredictionStatus> {
  const [groupsCountResult, groupPredictionsCountResult, tournamentResult] =
    await Promise.all([
      supabase.from("groups").select("id", { count: "exact", head: true }),
      supabase
        .from("group_predictions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("tournament_predictions")
        .select(TOURNAMENT_PREDICTION_FIELDS.join(", "))
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (groupsCountResult.error) {
    throw new Error(
      `No se pudieron contar los grupos: ${groupsCountResult.error.message}`,
    );
  }

  if (groupPredictionsCountResult.error) {
    throw new Error(
      `No se pudieron contar las predicciones de grupos: ${groupPredictionsCountResult.error.message}`,
    );
  }

  if (tournamentResult.error) {
    throw new Error(
      `No se pudieron cargar las predicciones globales: ${tournamentResult.error.message}`,
    );
  }

  const totalGroups = groupsCountResult.count ?? 0;
  const predictedGroups = groupPredictionsCountResult.count ?? 0;
  const groupPending = Math.max(totalGroups - predictedGroups, 0);
  const tournamentPrediction =
    tournamentResult.data as TournamentPredictionStatusRow | null;
  const completedTournamentFields = tournamentPrediction
    ? TOURNAMENT_PREDICTION_FIELDS.filter((field) =>
        isCompletedPredictionValue(tournamentPrediction[field]),
      ).length
    : 0;
  const pendingTournamentFields = Math.max(
    TOURNAMENT_PREDICTION_FIELDS.length - completedTournamentFields,
    0,
  );

  return {
    groups: {
      total: totalGroups,
      predicted: predictedGroups,
      pending: groupPending,
      isComplete: groupPending === 0,
    },
    tournament: {
      total: TOURNAMENT_PREDICTION_FIELDS.length,
      completed: completedTournamentFields,
      pending: pendingTournamentFields,
      isComplete: pendingTournamentFields === 0,
      hasPrediction: Boolean(tournamentPrediction),
    },
  };
}

export async function getUpcomingHomeMatches(
  supabase: SupabaseClient,
): Promise<HomeMatch[]> {
  const { data, error } = await supabase
    .from("matches_with_user_prediction")
    .select("*")
    .in("status", ["scheduled", "live"])
    .order("kickoff_at", { ascending: true })
    .limit(3);

  if (error) {
    throw new Error(
      `No se pudieron cargar los próximos partidos: ${error.message}`,
    );
  }

  return (data ?? []) as HomeMatch[];
}

export async function getHomeTournamentTiming(
  supabase: SupabaseClient,
): Promise<HomeTournamentTiming> {
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo cargar la fecha de inicio del torneo: ${error.message}`,
    );
  }

  const firstKickoffAt =
    (data as { kickoff_at: string } | null)?.kickoff_at ?? null;

  return {
    firstKickoffAt,
    hasStarted: firstKickoffAt
      ? new Date(firstKickoffAt).getTime() <= Date.now()
      : false,
  };
}

export async function getLastPlayedHomeMatches(
  supabase: SupabaseClient,
  userId: string,
): Promise<LastPlayedMatch[]> {
  const { data: matches, error: matchError } = await supabase
    .from("matches_with_user_prediction")
    .select("*")
    .eq("status", "completed")
    .order("kickoff_at", { ascending: false })
    .limit(2);

  if (matchError) {
    throw new Error(
      `No se pudieron cargar los últimos partidos jugados: ${matchError.message}`,
    );
  }

  const typedMatches = (matches ?? []) as HomeMatch[];

  return Promise.all(
    typedMatches.map(async (match) => {
      if (!match.prediction_id) {
        return {
          ...match,
          user_breakdown: null,
          user_points: null,
          is_user_prediction_calculated: false,
        };
      }

      const { data: predictionResult, error: predictionError } = await supabase
        .from("match_predictions_result_overview")
        .select("points, is_calculated, breakdown")
        .eq("match_id", match.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (predictionError) {
        throw new Error(
          `No se pudo cargar el desglose del último partido: ${predictionError.message}`,
        );
      }

      const typedPredictionResult =
        predictionResult as MatchPredictionOverviewRow | null;

      return {
        ...match,
        user_breakdown: typedPredictionResult?.breakdown ?? null,
        user_points: typedPredictionResult?.points ?? null,
        is_user_prediction_calculated:
          typedPredictionResult?.is_calculated ?? false,
      };
    }),
  );
}

export async function getLeaderboardEvolution(
  supabase: SupabaseClient,
  userId: string,
): Promise<LeaderboardEvolutionSeries[]> {
  const { data: leaderboard, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select("user_id, full_name, rank")
    .order("rank", { ascending: true })
    .limit(3);

  if (leaderboardError) {
    throw new Error(
      `No se pudo cargar la clasificación actual: ${leaderboardError.message}`,
    );
  }

  const { data: currentUserRow, error: currentUserError } = await supabase
    .from("leaderboard")
    .select("user_id, full_name, rank")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentUserError) {
    throw new Error(
      `No se pudo cargar tu posición actual: ${currentUserError.message}`,
    );
  }

  const profileRows = [
    ...(currentUserRow ? [currentUserRow as LeaderboardRow] : []),
    ...((leaderboard ?? []) as LeaderboardRow[]),
  ];
  const uniqueProfiles = Array.from(
    new Map(profileRows.map((row) => [row.user_id, row])).values(),
  ).slice(0, 4);

  if (uniqueProfiles.length === 0) return [];

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("leaderboard_snapshots")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10);

  if (snapshotsError) {
    throw new Error(
      `No se pudieron cargar los snapshots de clasificación: ${snapshotsError.message}`,
    );
  }

  const orderedSnapshots = [...((snapshots ?? []) as SnapshotRow[])].reverse();

  if (orderedSnapshots.length === 0) return [];

  const { data: entries, error: entriesError } = await supabase
    .from("leaderboard_snapshot_entries")
    .select("snapshot_id, user_id, rank, total_points")
    .in(
      "snapshot_id",
      orderedSnapshots.map((snapshot) => snapshot.id),
    )
    .in(
      "user_id",
      uniqueProfiles.map((profile) => profile.user_id),
    );

  if (entriesError) {
    throw new Error(
      `No se pudieron cargar las entradas del histórico: ${entriesError.message}`,
    );
  }

  const entriesByUserAndSnapshot = new Map(
    ((entries ?? []) as SnapshotEntryRow[]).map((entry) => [
      `${entry.user_id}-${entry.snapshot_id}`,
      entry,
    ]),
  );
  const colors = ["#2A398D", "#16A34A", "#F59E0B", "#DC2626"];

  return uniqueProfiles.map((profile, index) => ({
    userId: profile.user_id,
    name: profile.user_id === userId ? "Tú" : (profile.full_name ?? "Usuario"),
    color: colors[index] ?? "#64748B",
    isCurrentUser: profile.user_id === userId,
    points: orderedSnapshots
      .map((snapshot) => {
        const entry = entriesByUserAndSnapshot.get(
          `${profile.user_id}-${snapshot.id}`,
        );

        if (!entry) return null;

        return {
          snapshotId: snapshot.id,
          createdAt: snapshot.created_at,
          label: formatSnapshotLabel(snapshot.created_at),
          rank: entry.rank,
          totalPoints: entry.total_points,
        };
      })
      .filter((point): point is LeaderboardEvolutionSeries["points"][number] =>
        Boolean(point),
      ),
  }));
}

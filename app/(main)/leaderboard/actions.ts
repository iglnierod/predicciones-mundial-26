"use server";

import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";
import { parseUtcDate } from "@/lib/format/match";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Group,
  GroupPredictionSelection,
  MatchPrediction,
  MatchPredictionBreakdown,
  MatchPredictionOverview,
  MatchWithTeam,
  Team,
  TournamentPrediction,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type MatchQueryRelation<T> = T | T[] | null;

type MatchRowQuery = {
  id: number;
  round: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  groups: MatchQueryRelation<{
    name: string | null;
  }>;
  home_team: MatchQueryRelation<{
    name: string;
    code: string;
    flag_code: string;
  }>;
  away_team: MatchQueryRelation<{
    name: string;
    code: string;
    flag_code: string;
  }>;
};

type MatchPredictionWithMeta = MatchPrediction & {
  full_name: string;
  points: number | null;
  is_calculated: boolean;
  breakdown: MatchPredictionBreakdown | null;
};

type GroupPredictionRow = {
  group_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
};

export type LeaderboardGlobalTeam = Pick<
  Team,
  "id" | "name" | "code" | "flag_code"
>;

export type LeaderboardGlobalTeamsById = Record<number, LeaderboardGlobalTeam>;

type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  rank: number;
  group_points: number;
  match_points: number;
  extra_points: number;
  tournament_points: number;
  total_points: number;
};

type CompareScoreValue = {
  label: string;
  viewer: number;
  profile: number;
  difference: number;
};

type ComparePredictionPointRow = {
  user_id: string;
  match_id: number;
  points: number | null;
  breakdown: MatchPredictionBreakdown | null;
};

type CompareGroupPredictionRow = {
  user_id: string;
  group_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
};

type CompareTournamentPredictionRow = Pick<
  TournamentPrediction,
  | "user_id"
  | "world_cup_winner_team_id"
  | "top_scorer"
  | "top_assist"
  | "hat_trick_player"
  | "most_goals_in_a_match_team_id"
  | "how_many_penalty_shootouts"
  | "underdog_quarterfinal_team_id"
  | "spain_top_scorer"
  | "spain_top_assist"
  | "spain_red_card_player"
  | "spain_round"
  | "spain_total_goals"
>;

export type LeaderboardCompareStats = {
  viewerName: string;
  profileName: string;
  score: {
    viewerRank: number;
    profileRank: number;
    rankDifference: number;
    totalDifference: number;
    categories: CompareScoreValue[];
  };
  matches: {
    commonCalculatedMatches: number;
    viewerPoints: number;
    profilePoints: number;
    viewerWins: number;
    profileWins: number;
    ties: number;
    viewerExactScores: number;
    profileExactScores: number;
    viewerWinnerHits: number;
    profileWinnerHits: number;
    viewerAverage: number;
    profileAverage: number;
  };
  groups: {
    canCompare: boolean;
    sameGroups: number;
    matchingTeams: number;
  };
  globals: {
    canCompare: boolean;
    viewerCompleted: number;
    profileCompleted: number;
    samePredictions: number;
  };
};

const TOURNAMENT_COMPARE_FIELDS: Array<
  keyof Omit<CompareTournamentPredictionRow, "user_id">
> = [
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
];

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getDisplayName(profile: Pick<LeaderboardRow, "full_name">) {
  return profile.full_name ?? "Usuario";
}

function getCompletedTournamentFieldCount(
  prediction: CompareTournamentPredictionRow | null,
) {
  if (!prediction) return 0;

  return TOURNAMENT_COMPARE_FIELDS.filter((field) => {
    const value = prediction[field];

    if (typeof value === "number") return true;
    if (typeof value === "string") return value.trim().length > 0;

    return false;
  }).length;
}

function normalizeTournamentValue(value: string | number | null | undefined) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim().toLocaleLowerCase("es");

  return null;
}

function getPredictionMapByUser<T extends { user_id: string }>(
  rows: T[],
  viewerUserId: string,
  profileUserId: string,
) {
  return {
    viewer: rows.find((row) => row.user_id === viewerUserId) ?? null,
    profile: rows.find((row) => row.user_id === profileUserId) ?? null,
  };
}

function isWinnerHit(ruleKey: string | null | undefined) {
  return (
    ruleKey === "match_exact_score" ||
    ruleKey === "match_winner_and_difference" ||
    ruleKey === "match_winner_only"
  );
}

async function getTournamentHasStarted(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo comprobar si el torneo ha empezado.");
  }

  return data?.kickoff_at
    ? parseUtcDate(data.kickoff_at).getTime() <= Date.now()
    : false;
}

export async function loadLeaderboardGlobalBreakdown(profileUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      prediction: null as TournamentPrediction | null,
      teamsById: {} as LeaderboardGlobalTeamsById,
      error: "Debes iniciar sesión para ver estas predicciones.",
    };
  }

  let hasStarted = false;

  try {
    hasStarted = await getTournamentHasStarted(supabase);
  } catch (error) {
    return {
      success: false,
      prediction: null as TournamentPrediction | null,
      teamsById: {} as LeaderboardGlobalTeamsById,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo comprobar si el torneo ha empezado.",
    };
  }

  const isOwnProfile = user.id === profileUserId;

  if (!isOwnProfile && !hasStarted) {
    return {
      success: false,
      prediction: null as TournamentPrediction | null,
      teamsById: {} as LeaderboardGlobalTeamsById,
      error:
        "Las predicciones globales de otros usuarios estarán disponibles cuando empiece el torneo.",
    };
  }

  const dataClient = isOwnProfile ? supabase : createSupabaseAdminClient();

  const { data: prediction, error: predictionError } = await dataClient
    .from("tournament_predictions")
    .select("*")
    .eq("user_id", profileUserId)
    .maybeSingle();

  if (predictionError) {
    return {
      success: false,
      prediction: null as TournamentPrediction | null,
      teamsById: {} as LeaderboardGlobalTeamsById,
      error: "No se pudieron cargar las predicciones globales del usuario.",
    };
  }

  const typedPrediction = prediction as TournamentPrediction | null;
  const teamIds = typedPrediction
    ? [
        typedPrediction.world_cup_winner_team_id,
        typedPrediction.most_goals_in_a_match_team_id,
        typedPrediction.underdog_quarterfinal_team_id,
      ].filter((teamId): teamId is number => typeof teamId === "number")
    : [];
  const uniqueTeamIds = [...new Set(teamIds)];
  let teamsById: LeaderboardGlobalTeamsById = {};

  if (uniqueTeamIds.length > 0) {
    const { data: teams, error: teamsError } = await dataClient
      .from("teams")
      .select("id, name, code, flag_code")
      .in("id", uniqueTeamIds);

    if (teamsError) {
      return {
        success: false,
        prediction: null as TournamentPrediction | null,
        teamsById: {} as LeaderboardGlobalTeamsById,
        error: "No se pudieron cargar los equipos de las predicciones.",
      };
    }

    teamsById = Object.fromEntries(
      ((teams ?? []) as LeaderboardGlobalTeam[]).map((team) => [team.id, team]),
    ) as LeaderboardGlobalTeamsById;
  }

  return {
    success: true,
    prediction: typedPrediction,
    teamsById,
    error: null,
  };
}

export async function loadLeaderboardCompareStats(profileUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error: "Debes iniciar sesión para comparar usuarios.",
    };
  }

  if (user.id === profileUserId) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error: "No puedes comparar tu perfil contigo mismo.",
    };
  }

  const { data: leaderboardRows, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select(
      `user_id, full_name, rank, group_points, match_points,
      extra_points, tournament_points, total_points`,
    )
    .in("user_id", [user.id, profileUserId]);

  if (leaderboardError) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error: "No se pudieron cargar los puntos de los usuarios.",
    };
  }

  const typedLeaderboardRows = (leaderboardRows ?? []) as LeaderboardRow[];
  const viewerProfile = typedLeaderboardRows.find(
    (row) => row.user_id === user.id,
  );
  const profile = typedLeaderboardRows.find(
    (row) => row.user_id === profileUserId,
  );

  if (!viewerProfile || !profile) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error: "No se encontraron los usuarios para comparar.",
    };
  }

  let hasStarted = false;

  try {
    hasStarted = await getTournamentHasStarted(supabase);
  } catch (error) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo comprobar si el torneo ha empezado.",
    };
  }

  const adminClient = createSupabaseAdminClient();
  const [{ data: matchRows, error: matchError }] = await Promise.all([
    adminClient
      .from("match_predictions_result_overview")
      .select("user_id, match_id, points, breakdown")
      .in("user_id", [user.id, profileUserId])
      .eq("is_calculated", true),
  ]);

  if (matchError) {
    return {
      success: false,
      stats: null as LeaderboardCompareStats | null,
      error: "No se pudieron cargar las estadísticas de partidos.",
    };
  }

  const predictionRows = (matchRows ?? []) as ComparePredictionPointRow[];
  const viewerMatches = new Map(
    predictionRows
      .filter((row) => row.user_id === user.id)
      .map((row) => [row.match_id, row]),
  );
  const profileMatches = new Map(
    predictionRows
      .filter((row) => row.user_id === profileUserId)
      .map((row) => [row.match_id, row]),
  );
  const commonMatchIds = [...viewerMatches.keys()].filter((matchId) =>
    profileMatches.has(matchId),
  );

  let viewerMatchPoints = 0;
  let profileMatchPoints = 0;
  let viewerMatchWins = 0;
  let profileMatchWins = 0;
  let matchTies = 0;
  let viewerExactScores = 0;
  let profileExactScores = 0;
  let viewerWinnerHits = 0;
  let profileWinnerHits = 0;

  commonMatchIds.forEach((matchId) => {
    const viewerPrediction = viewerMatches.get(matchId);
    const profilePrediction = profileMatches.get(matchId);
    const viewerPoints = viewerPrediction?.points ?? 0;
    const profilePoints = profilePrediction?.points ?? 0;
    const viewerRuleKey = viewerPrediction?.breakdown?.ruleKey;
    const profileRuleKey = profilePrediction?.breakdown?.ruleKey;

    viewerMatchPoints += viewerPoints;
    profileMatchPoints += profilePoints;

    if (viewerPoints > profilePoints) viewerMatchWins += 1;
    else if (profilePoints > viewerPoints) profileMatchWins += 1;
    else matchTies += 1;

    if (viewerRuleKey === "match_exact_score") viewerExactScores += 1;
    if (profileRuleKey === "match_exact_score") profileExactScores += 1;
    if (isWinnerHit(viewerRuleKey)) viewerWinnerHits += 1;
    if (isWinnerHit(profileRuleKey)) profileWinnerHits += 1;
  });

  let groupStats: LeaderboardCompareStats["groups"] = {
    canCompare: hasStarted,
    sameGroups: 0,
    matchingTeams: 0,
  };
  let globalStats: LeaderboardCompareStats["globals"] = {
    canCompare: hasStarted,
    viewerCompleted: 0,
    profileCompleted: 0,
    samePredictions: 0,
  };

  if (hasStarted) {
    const [groupResult, tournamentResult] = await Promise.all([
      adminClient
        .from("group_predictions")
        .select("user_id, group_id, team_a_id, team_b_id")
        .in("user_id", [user.id, profileUserId]),
      adminClient
        .from("tournament_predictions")
        .select(TOURNAMENT_COMPARE_FIELDS.join(", ") + ", user_id")
        .in("user_id", [user.id, profileUserId]),
    ]);

    if (groupResult.error) {
      return {
        success: false,
        stats: null as LeaderboardCompareStats | null,
        error: "No se pudieron cargar las estadísticas de grupos.",
      };
    }

    if (tournamentResult.error) {
      return {
        success: false,
        stats: null as LeaderboardCompareStats | null,
        error: "No se pudieron cargar las estadísticas globales.",
      };
    }

    const groupRows = (groupResult.data ?? []) as CompareGroupPredictionRow[];
    const viewerGroups = new Map(
      groupRows
        .filter((row) => row.user_id === user.id)
        .map((row) => [row.group_id, row]),
    );
    const profileGroups = new Map(
      groupRows
        .filter((row) => row.user_id === profileUserId)
        .map((row) => [row.group_id, row]),
    );
    const commonGroupIds = [...viewerGroups.keys()].filter((groupId) =>
      profileGroups.has(groupId),
    );

    let sameGroups = 0;
    let matchingTeams = 0;

    commonGroupIds.forEach((groupId) => {
      const viewerPrediction = viewerGroups.get(groupId);
      const profilePrediction = profileGroups.get(groupId);
      const viewerTeamIds = [
        viewerPrediction?.team_a_id,
        viewerPrediction?.team_b_id,
      ].filter((teamId): teamId is number => typeof teamId === "number");
      const profileTeamIds = [
        profilePrediction?.team_a_id,
        profilePrediction?.team_b_id,
      ].filter((teamId): teamId is number => typeof teamId === "number");
      const groupMatches = viewerTeamIds.filter((teamId) =>
        profileTeamIds.includes(teamId),
      ).length;

      matchingTeams += groupMatches;
      if (groupMatches === 2) sameGroups += 1;
    });

    groupStats = {
      canCompare: true,
      sameGroups,
      matchingTeams,
    };

    const tournamentRows = (tournamentResult.data ??
      []) as unknown as CompareTournamentPredictionRow[];
    const tournamentPredictions = getPredictionMapByUser(
      tournamentRows,
      user.id,
      profileUserId,
    );
    let samePredictions = 0;

    TOURNAMENT_COMPARE_FIELDS.forEach((field) => {
      const viewerValue = normalizeTournamentValue(
        tournamentPredictions.viewer?.[field],
      );
      const profileValue = normalizeTournamentValue(
        tournamentPredictions.profile?.[field],
      );

      if (viewerValue && profileValue && viewerValue === profileValue) {
        samePredictions += 1;
      }
    });

    globalStats = {
      canCompare: true,
      viewerCompleted: getCompletedTournamentFieldCount(
        tournamentPredictions.viewer,
      ),
      profileCompleted: getCompletedTournamentFieldCount(
        tournamentPredictions.profile,
      ),
      samePredictions,
    };
  }

  const stats: LeaderboardCompareStats = {
    viewerName: getDisplayName(viewerProfile),
    profileName: getDisplayName(profile),
    score: {
      viewerRank: viewerProfile.rank,
      profileRank: profile.rank,
      rankDifference: profile.rank - viewerProfile.rank,
      totalDifference: viewerProfile.total_points - profile.total_points,
      categories: [
        {
          label: "Total",
          viewer: viewerProfile.total_points,
          profile: profile.total_points,
          difference: viewerProfile.total_points - profile.total_points,
        },
        {
          label: "Globales",
          viewer: viewerProfile.tournament_points,
          profile: profile.tournament_points,
          difference:
            viewerProfile.tournament_points - profile.tournament_points,
        },
        {
          label: "Grupos",
          viewer: viewerProfile.group_points,
          profile: profile.group_points,
          difference: viewerProfile.group_points - profile.group_points,
        },
        {
          label: "Partidos",
          viewer: viewerProfile.match_points,
          profile: profile.match_points,
          difference: viewerProfile.match_points - profile.match_points,
        },
        {
          label: "Extras",
          viewer: viewerProfile.extra_points,
          profile: profile.extra_points,
          difference: viewerProfile.extra_points - profile.extra_points,
        },
      ],
    },
    matches: {
      commonCalculatedMatches: commonMatchIds.length,
      viewerPoints: viewerMatchPoints,
      profilePoints: profileMatchPoints,
      viewerWins: viewerMatchWins,
      profileWins: profileMatchWins,
      ties: matchTies,
      viewerExactScores,
      profileExactScores,
      viewerWinnerHits,
      profileWinnerHits,
      viewerAverage:
        commonMatchIds.length > 0
          ? viewerMatchPoints / commonMatchIds.length
          : 0,
      profileAverage:
        commonMatchIds.length > 0
          ? profileMatchPoints / commonMatchIds.length
          : 0,
    },
    groups: groupStats,
    globals: globalStats,
  };

  return {
    success: true,
    stats,
    error: null,
  };
}

export async function loadLeaderboardGroupBreakdown(profileUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "Debes iniciar sesión para ver estas predicciones.",
    };
  }

  const closeAt = await getTournamentPredictionsCloseAt(supabase);
  const canViewOtherUserPredictions = areTournamentPredictionsClosed(closeAt);

  if (user.id !== profileUserId && !canViewOtherUserPredictions) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error:
        "Las predicciones de otros usuarios estarán disponibles al cierre.",
    };
  }

  const [
    { data: groupsData, error: groupsError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    supabase
      .from("groups")
      .select(
        `
          id,
          name,
          qualified_team_a_id,
          qualified_team_b_id,
          teams!teams_group_id_fkey (
            id,
            name,
            code,
            flag_code,
            group_id
          )
        `,
      )
      .order("name"),
    supabase
      .from("group_predictions")
      .select("group_id, team_a_id, team_b_id")
      .eq("user_id", profileUserId),
  ]);

  if (groupsError) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "No se pudieron cargar los grupos.",
    };
  }

  if (predictionsError) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "No se pudieron cargar las predicciones del usuario.",
    };
  }

  const groups: Group[] = (groupsData ?? []).map((group) => ({
    ...group,
    teams: [...(group.teams ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    ),
  }));

  const predictionSelection = (
    predictions ?? []
  ).reduce<GroupPredictionSelection>((acc, prediction: GroupPredictionRow) => {
    acc[prediction.group_id] = [
      prediction.team_a_id,
      prediction.team_b_id,
    ].filter((value): value is number => value !== null);
    return acc;
  }, {});

  return {
    success: true,
    groups,
    predictionSelection,
    error: null,
  };
}

export async function loadLeaderboardMatchBreakdown(
  profileUserId: string,
  pageToLoad: number,
  pageSize: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      items: [],
      hasMore: false,
      error: "Debes iniciar sesión para comparar predicciones por partido.",
    };
  }

  const safePage = Math.max(0, pageToLoad);
  const safePageSize = Math.max(1, Math.min(pageSize, 50));
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;
  const isOwnProfile = user.id === profileUserId;

  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
        id,
        round,
        kickoff_at,
        status,
        home_score,
        away_score,
        stadium,
        stadium_city,
        stadium_country,
        groups (
          name
        ),
        home_team:teams!matches_home_team_id_fkey (
          name,
          code,
          flag_code
        ),
        away_team:teams!matches_away_team_id_fkey (
          name,
          code,
          flag_code
        )
      `,
    )
    .eq("status", "completed")
    .order("kickoff_at", { ascending: false })
    .range(from, to);

  if (matchesError) {
    return {
      success: false,
      items: [],
      hasMore: false,
      error: "No se pudieron cargar los partidos.",
    };
  }

  const rawMatches = (matchesData ?? []) as MatchRowQuery[];
  const matches: MatchWithTeam[] = rawMatches.map((match) => {
    const group = getSingleRelation(match.groups);
    const homeTeam = getSingleRelation(match.home_team);
    const awayTeam = getSingleRelation(match.away_team);

    return {
      id: match.id,
      round: match.round,
      kickoff_at: match.kickoff_at,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
      stadium: match.stadium,
      stadium_city: match.stadium_city,
      stadium_country: match.stadium_country,
      group_name: group?.name ?? null,
      home_team_name: homeTeam?.name ?? "",
      home_team_code: homeTeam?.code ?? "",
      home_team_flag_code: homeTeam?.flag_code ?? "",
      away_team_name: awayTeam?.name ?? "",
      away_team_code: awayTeam?.code ?? "",
      away_team_flag_code: awayTeam?.flag_code ?? "",
    };
  });

  const matchIds = matches.map((match) => match.id);
  const userIds = isOwnProfile ? [profileUserId] : [profileUserId, user.id];
  let predictionMap = new Map<string, MatchPredictionWithMeta>();

  if (matchIds.length > 0) {
    const { data: predictionsData, error: predictionsError } = await supabase
      .from("match_predictions_result_overview")
      .select(
        `
          user_id,
          match_id,
          predicted_home_score,
          predicted_away_score,
          full_name,
          points,
          is_calculated,
          breakdown
        `,
      )
      .in("match_id", matchIds)
      .in("user_id", userIds)
      .eq("is_calculated", true);

    if (predictionsError) {
      return {
        success: false,
        items: [],
        hasMore: false,
        error: "No se pudieron cargar las predicciones.",
      };
    }

    const typedPredictions = (predictionsData ??
      []) as MatchPredictionOverview[];

    predictionMap = new Map(
      typedPredictions.map((row) => [
        `${row.match_id}-${row.user_id}`,
        {
          user_id: row.user_id,
          match_id: row.match_id,
          predicted_home_score: row.predicted_home_score,
          predicted_away_score: row.predicted_away_score,
          full_name: row.full_name,
          points: row.points,
          is_calculated: row.is_calculated,
          breakdown: row.breakdown,
        },
      ]),
    );
  }

  const items = matches.map((match) => ({
    match,
    viewerPrediction: predictionMap.get(`${match.id}-${user.id}`) ?? null,
    profilePrediction:
      predictionMap.get(`${match.id}-${profileUserId}`) ?? null,
  }));

  return {
    success: true,
    items,
    hasMore: matches.length === safePageSize,
    error: null,
  };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { isPredictionClosed } from "@/lib/format/match";
import type { MatchPrediction, MatchWithPrediction } from "@/types";

type MatchFilter = "scheduled" | "completed";

type LoadMatchesInput = {
  filter: MatchFilter;
  from: number;
  pageSize: number;
};

type SaveMatchPredictionInput = {
  matchId: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
};

export async function loadMatches({
  filter,
  from,
  pageSize,
}: LoadMatchesInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      data: [] as MatchWithPrediction[],
      error: "Debes iniciar sesión para cargar los partidos.",
    };
  }

  const safeFrom = Math.max(0, from);
  const safePageSize = Math.max(1, Math.min(pageSize, 50));
  const to = safeFrom + safePageSize - 1;

  let query = supabase
    .from("matches_with_user_prediction")
    .select("*")
    .order("kickoff_at", { ascending: filter === "scheduled" });

  if (filter === "scheduled") {
    query = query.in("status", ["scheduled", "live"]);
  } else {
    query = query.eq("status", "completed");
  }

  const { data, error } = await query.range(safeFrom, to);

  if (error) {
    return {
      success: false,
      data: [] as MatchWithPrediction[],
      error: "No se pudieron cargar los partidos.",
    };
  }

  return {
    success: true,
    data: (data ?? []) as MatchWithPrediction[],
    error: null,
  };
}

export async function saveMatchPrediction({
  matchId,
  predictedHomeScore,
  predictedAwayScore,
}: SaveMatchPredictionInput) {
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return {
      success: false,
      data: null,
      error: "Partido no válido.",
    };
  }

  if (
    !Number.isInteger(predictedHomeScore) ||
    !Number.isInteger(predictedAwayScore) ||
    predictedHomeScore < 0 ||
    predictedHomeScore > 10 ||
    predictedAwayScore < 0 ||
    predictedAwayScore > 10
  ) {
    return {
      success: false,
      data: null,
      error: "Resultado no válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      data: null,
      error: "Debes iniciar sesión para guardar tu predicción.",
    };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_at, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return {
      success: false,
      data: null,
      error: "No se pudo validar el partido.",
    };
  }

  if (match.status !== "scheduled" || isPredictionClosed(match.kickoff_at)) {
    return {
      success: false,
      data: null,
      error: "La predicción está cerrada.",
    };
  }

  const matchPrediction: MatchPrediction = {
    user_id: user.id,
    match_id: matchId,
    predicted_home_score: predictedHomeScore,
    predicted_away_score: predictedAwayScore,
  };

  const { data, error } = await supabase
    .from("match_predictions")
    .upsert(matchPrediction, {
      onConflict: "user_id,match_id",
    })
    .select("predicted_home_score, predicted_away_score")
    .single();

  if (error || !data) {
    return {
      success: false,
      data: null,
      error: "No se pudo guardar la predicción.",
    };
  }

  return {
    success: true,
    data,
    error: null,
  };
}

export async function loadMatchPredictions(matchId: number) {
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return {
      success: false,
      data: [],
      viewerUserId: null,
      error: "Partido no válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      data: [],
      viewerUserId: null,
      error: "Debes iniciar sesión para ver las predicciones.",
    };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_at, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return {
      success: false,
      data: [],
      viewerUserId: user.id,
      error: "No se pudo validar el partido.",
    };
  }

  const canViewPredictions =
    match.status !== "scheduled" || isPredictionClosed(match.kickoff_at);

  if (!canViewPredictions) {
    return {
      success: false,
      data: [],
      viewerUserId: user.id,
      error: "Las predicciones de este partido todavía no son visibles.",
    };
  }

  const { data, error } = await supabase
    .from("match_predictions_result_overview")
    .select("*")
    .eq("match_id", matchId)
    .order("points", { ascending: false });

  if (error) {
    return {
      success: false,
      data: [],
      viewerUserId: user.id,
      error: "No se pudieron cargar las predicciones.",
    };
  }

  return {
    success: true,
    data: data ?? [],
    viewerUserId: user.id,
    error: null,
  };
}

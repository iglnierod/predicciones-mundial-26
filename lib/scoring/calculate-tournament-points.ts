import { SupabaseClient } from "@supabase/supabase-js";
import { createLeaderboardSnapshot } from "@/lib/repositories/leaderboard-snapshots-repository";
import {
  deleteTournamentPredictionPoints,
  getTournamentPredictions,
  getTournamentResult,
  insertTournamentPredictionPoints,
} from "@/lib/repositories/tournament-predictions-repository";
import { recalculateUserPoints } from "@/lib/repositories/user-points-repository";
import {
  calculateTournamentPredictionPoints,
  countResolvedTournamentFields,
} from "./tournament-points";
import { getScoringRulesMap } from "./rules";

export async function calculateTournamentPoints(supabase: SupabaseClient) {
  const result = await getTournamentResult(supabase);

  if (!result) {
    throw new Error("No hay respuestas oficiales de predicciones globales.");
  }

  const resolvedFields = countResolvedTournamentFields(result);

  if (resolvedFields === 0) {
    throw new Error("No hay ninguna respuesta oficial global definida.");
  }

  const scoringRules = await getScoringRulesMap(supabase);
  const previousPoints = await deleteTournamentPredictionPoints(supabase);
  const predictions = await getTournamentPredictions(supabase);
  const affectedUserIds = new Set<string>(previousPoints.affectedUserIds);

  const rows = predictions.map((prediction) => {
    const breakdown = calculateTournamentPredictionPoints({
      prediction,
      result,
      scoringRules,
    });

    affectedUserIds.add(prediction.user_id);

    return {
      user_id: prediction.user_id,
      prediction_type: "tournament" as const,
      prediction_id: prediction.id,
      match_id: null,
      group_id: null,
      points: breakdown.points,
      breakdown,
    };
  });

  await insertTournamentPredictionPoints(supabase, rows);

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  const leaderboardSnapshot = await createLeaderboardSnapshot(supabase, {
    sourceType: "tournament",
    sourceId: "globals",
  });

  return {
    resolvedFields,
    deletedPreviousPoints: previousPoints.deletedPoints,
    calculatedPredictions: predictions.length,
    totalAwardedPoints: rows.reduce((total, row) => total + row.points, 0),
    recalculatedUsers: affectedUserIds.size,
    leaderboardSnapshot,
  };
}

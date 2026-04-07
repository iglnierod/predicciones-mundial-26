import { SupabaseClient } from "@supabase/supabase-js";
import {
  getMatchById,
  markMatchPointsCalculated,
} from "../repositories/matches-repository";
import {
  buildProcessedKey,
  calculateStandardMatchPredictionPoints,
} from "./match-points";
import { getScoringRulesMap } from "./rules";
import {
  deleteMatchPredictionPoints,
  getMatchPredictions,
  insertPredictionPointsRow,
} from "../repositories/predictions-repository";
import { recalculateUserPoints } from "../repositories/user-points-repository";

type CalculateMatchPointsOptions = {
  force?: boolean;
};

export async function calculateMatchPoints(
  supabaseAdmin: SupabaseClient,
  matchId: number,
  options: CalculateMatchPointsOptions = {},
) {
  const force = options.force ?? false;

  const match = await getMatchById(supabaseAdmin, matchId);

  if (!match) {
    throw new Error("Partido no encontrado");
  }

  if (match.status !== "completed") {
    throw new Error("El partido no está completado");
  }

  if (match.home_score == null || match.away_score == null) {
    throw new Error("El partido no tiene marcador final");
  }

  const processedKey = buildProcessedKey(match.home_score, match.away_score);

  if (!force && match.last_processed_key === processedKey) {
    return {
      ok: true,
      skipped: true,
      reason: "already_processed",
      matchId,
      processedKey,
    };
  }

  const scoringRules = await getScoringRulesMap(supabaseAdmin);
  const predictions = await getMatchPredictions(supabaseAdmin, matchId);

  await deleteMatchPredictionPoints(supabaseAdmin, matchId);

  const rows = predictions.map((prediction) => {
    const result = calculateStandardMatchPredictionPoints({
      realHomeScore: match.home_score!,
      realAwayScore: match.away_score!,
      predictedHomeScore: prediction.predicted_home_score,
      predictedAwayScore: prediction.predicted_away_score,
      scoringRules,
    });

    return {
      user_id: prediction.user_id,
      prediction_type: "match" as const,
      prediction_id: prediction.id,
      match_id: matchId,
      points: result.points,
      breakdown: result.breakdown,
    };
  });

  await insertPredictionPointsRow(supabaseAdmin, rows);

  const affectedUserIds = [...new Set(predictions.map((p) => p.user_id))];

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabaseAdmin, userId);
  }

  await markMatchPointsCalculated({
    supabase: supabaseAdmin,
    matchId,
    processedKey,
  });

  return {
    ok: true,
    skipped: false,
    matchId,
    processedKey,
    predictionsProcessed: predictions.length,
    affectedUsers: affectedUserIds.length,
  };
}

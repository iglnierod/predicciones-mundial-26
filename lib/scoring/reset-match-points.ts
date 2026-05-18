import { SupabaseClient } from "@supabase/supabase-js";
import { deleteMatchPredictionPoints } from "../repositories/predictions-repository";
import { clearMatchPointsCalculated } from "../repositories/matches-repository";
import { recalculateUserPoints } from "../repositories/user-points-repository";

export async function resetMatchPoints(
  supabase: SupabaseClient,
  matchId: number,
) {
  const { deletedPoints, affectedUserIds } = await deleteMatchPredictionPoints(
    supabase,
    matchId,
  );

  const clearedMatch = await clearMatchPointsCalculated(supabase, matchId);

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  return {
    matchId: clearedMatch.id,
    apiMatchId: clearedMatch.api_match_id,
    matchNumber: clearedMatch.match_number,
    deletedPoints,
    recalculatedUsers: affectedUserIds.length,
  };
}

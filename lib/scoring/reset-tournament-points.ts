import { SupabaseClient } from "@supabase/supabase-js";
import { deleteTournamentPredictionPoints } from "@/lib/repositories/tournament-predictions-repository";
import { recalculateUserPoints } from "@/lib/repositories/user-points-repository";

export async function resetTournamentPoints(supabase: SupabaseClient) {
  const { deletedPoints, affectedUserIds } =
    await deleteTournamentPredictionPoints(supabase);

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  return {
    deletedPoints,
    recalculatedUsers: affectedUserIds.length,
  };
}

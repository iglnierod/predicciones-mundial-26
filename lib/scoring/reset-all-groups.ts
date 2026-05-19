import { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteAllGroupPredictionPoints,
  recalculateUserPoints,
} from "../repositories/user-points-repository";
import { resetGroupQualifiedTeams } from "../repositories/groups-repository";

export async function resetAllGroups(supabase: SupabaseClient) {
  const { deletedPoints, affectedUserIds } =
    await deleteAllGroupPredictionPoints(supabase);

  const { resetGroups } = await resetGroupQualifiedTeams(supabase);

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  return {
    resetGroups,
    deletedPoints,
    recalculatedUsers: affectedUserIds.length,
  };
}

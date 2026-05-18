import { SupabaseClient } from "@supabase/supabase-js";
import { resetSingleGroupQualifiedTeams } from "../repositories/groups-repository";
import {
  deleteSingleGroupPredictionPoints,
  recalculateUserPoints,
} from "../repositories/user-points-repository";

export async function resetSingleGroup(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { deletedPoints, affectedUserIds } =
    await deleteSingleGroupPredictionPoints(supabase, groupId);

  const resetGroup = await resetSingleGroupQualifiedTeams(supabase, groupId);

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  return {
    groupId: resetGroup.id,
    groupName: resetGroup.name,
    resetGroups: 1,
    deletedPoints,
    recalculatedUsers: affectedUserIds.length,
  };
}

import { SupabaseClient } from "@supabase/supabase-js";
import { getGroupWithQualifiedTeamsById } from "../repositories/groups-repository";
import {
  deleteSingleGroupPredictionPoints,
  recalculateUserPoints,
  upsertGroupPreidctionPoint,
} from "../repositories/user-points-repository";
import { getGruopPredictionsByGroupId } from "../repositories/group-predictions-repository";
import { calculateSingleGroupPredictionPoints } from "./group-points";

export async function calculateSingleGroupPoints(
  supabase: SupabaseClient,
  groupId: number,
) {
  const group = await getGroupWithQualifiedTeamsById(supabase, groupId);

  const previousPoints = await deleteSingleGroupPredictionPoints(
    supabase,
    groupId,
  );

  const predictions = await getGruopPredictionsByGroupId(supabase, groupId);

  const affectedUserIds = new Set<string>(previousPoints.affectedUserIds);

  let calculatedPredictions = 0;
  let totalAwardedPoints = 0;

  for (const prediction of predictions) {
    const scoring = calculateSingleGroupPredictionPoints(
      {
        groupId: group.id,
        qualifiedTeamAId: group.qualified_team_a_id,
        qualifiedTeamBId: group.qualified_team_b_id,
      },
      prediction,
    );

    await upsertGroupPreidctionPoint(supabase, {
      userId: prediction.user_id,
      predictionId: prediction.id,
      groupId: prediction.group_id,
      points: scoring.points,
      breakdown: scoring.breakdown,
    });

    affectedUserIds.add(prediction.user_id);
    calculatedPredictions++;
    totalAwardedPoints += scoring.points;
  }

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  return {
    groupId: group.id,
    groupName: group.name,
    deletedPreviousPoints: previousPoints.deletedPoints,
    calculatedPredictions,
    totalAwardedPoints,
    recalculateUsers: affectedUserIds.size,
  };
}

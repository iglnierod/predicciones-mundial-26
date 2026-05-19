import { SupabaseClient } from "@supabase/supabase-js";
import { fetchWorldCupQualifiedGroup } from "../external/wc2026-api";
import { updateSingleGroupQualifiedTeams } from "../repositories/groups-repository";

export async function fetchAndSaveSingleQualifiedGroup(
  supabase: SupabaseClient,
  groupId: number,
) {
  const qualifiedGroup = await fetchWorldCupQualifiedGroup(groupId);

  const updatedGroup = await updateSingleGroupQualifiedTeams(
    supabase,
    qualifiedGroup,
  );

  return {
    groupId: updatedGroup.id,
    groupName: updatedGroup.name,
    qualifiedTeamAId: updatedGroup.qualified_team_a_id,
    qualifiedTeamBId: updatedGroup.qualified_team_b_id,
  };
}

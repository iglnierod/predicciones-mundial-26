import { SupabaseClient } from "@supabase/supabase-js";
import { fetchWorldCupQualifiedGroups } from "../external/wc2026-api";
import { updateGroupsQualifiedTeams } from "../repositories/groups-repository";

export async function fetchAndSaveQualifiedGroups(supabase: SupabaseClient) {
  const qualifiedGroups = await fetchWorldCupQualifiedGroups();

  const result = await updateGroupsQualifiedTeams(supabase, qualifiedGroups);

  console.log(qualifiedGroups.length);
  console.log(result.updatedGroups);

  return {
    fetchedGroups: qualifiedGroups.length,
    updatedGroups: result.updatedGroups,
  };
}

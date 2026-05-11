import { createClient } from "../supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { QualifiedGroupFromApi } from "@/lib/external/wc2026-api";

export async function getGroupsWithQualifiedTeams() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups_with_qualified_teams")
    .select("*")
    .order("group_name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los grupos: ${error.message}`);
  }

  return data ?? [];
}

export async function resetGroupQualifieldTeams() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .update({
      qualified_team_a_id: null,
      qualified_team_b_id: null,
    })
    .not("id", "is", null);

  if (error) {
    throw new Error(`No se pudieron resetear los grupos: ${error.message}`);
  }
}

export async function updateGroupsQualifiedTeams(
  supabase: SupabaseClient,
  qualifiedGroups: QualifiedGroupFromApi[],
) {
  let updatedGroups = 0;

  for (const group of qualifiedGroups) {
    const { data, error } = await supabase
      .from("groups")
      .update({
        qualified_team_a_id: group.qualifiedTeamAApiId,
        qualified_team_b_id: group.qualifiedTeamBApiId,
      })
      .eq("id", group.groupId)
      .select("id, name, qualified_team_a_id, qualified_team_b_id");

    console.log("GROUP UPDATE RESULT:", {
      groupId: group.groupId,
      groupName: group.groupName,
      qualifiedTeamAId: group.qualifiedTeamAApiId,
      qualifiedTeamBId: group.qualifiedTeamBApiId,
      updatedRows: data?.length ?? 0,
      data,
      error,
    });

    if (error) {
      throw new Error(
        `Error actualizando grupo ${group.groupId} (${group.groupName}): ${error.message}`,
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        `No se actualizó ningún grupo con id = ${group.groupId} (${group.groupName})`,
      );
    }

    updatedGroups += data.length;
  }

  return {
    updatedGroups,
  };
}

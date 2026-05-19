import { SupabaseClient } from "@supabase/supabase-js";
import { QualifiedGroupFromApi } from "@/lib/external/wc2026-api";

export async function getGroupsWithQualifiedTeams(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("groups_with_qualified_teams")
    .select("*")
    .order("group_name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los grupos: ${error.message}`);
  }

  return data ?? [];
}

export async function updateGroupsQualifiedTeams(
  supabase: SupabaseClient,
  qualifiedGroups: QualifiedGroupFromApi[],
) {
  if (qualifiedGroups.length === 0) {
    return { updatedGroups: 0 };
  }

  const rows = qualifiedGroups.map((group) => ({
    id: group.groupId,
    name: group.groupName,
    qualified_team_a_id: group.qualifiedTeamAApiId,
    qualified_team_b_id: group.qualifiedTeamBApiId,
  }));

  const { data, error } = await supabase
    .from("groups")
    .upsert(rows, { onConflict: "id" })
    .select("id, name, qualified_team_a_id, qualified_team_b_id");

  if (error) {
    throw new Error(`Error actualizando grupos: ${error.message}`);
  }

  const updatedGroups = data?.length ?? 0;

  if (updatedGroups !== qualifiedGroups.length) {
    throw new Error(
      `Se actualizaron ${updatedGroups} grupos de ${qualifiedGroups.length} esperados`,
    );
  }

  return {
    updatedGroups,
  };
}

export async function resetGroupQualifiedTeams(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("groups")
    .update({
      qualified_team_a_id: null,
      qualified_team_b_id: null,
    })
    .gt("id", 0)
    .select("id, name, qualified_team_a_id, qualified_team_b_id");

  if (error) {
    throw new Error(`No se pudieron resetear los grupos: ${error.message}`);
  }

  return {
    resetGroups: data?.length ?? 0,
  };
}

export async function resetSingleGroupQualifiedTeams(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { data, error } = await supabase
    .from("groups")
    .update({
      qualified_team_a_id: null,
      qualified_team_b_id: null,
    })
    .eq("id", groupId)
    .select("id, name, qualified_team_a_id, qualified_team_b_id")
    .single();

  if (error) {
    throw new Error(`No se pudo resetear el grupo: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No se encontró ningún grupo con id ${groupId}`);
  }

  return data;
}

export async function updateSingleGroupQualifiedTeams(
  supabase: SupabaseClient,
  group: QualifiedGroupFromApi,
) {
  const { data, error } = await supabase
    .from("groups")
    .update({
      qualified_team_a_id: group.qualifiedTeamAApiId,
      qualified_team_b_id: group.qualifiedTeamBApiId,
    })
    .eq("id", group.groupId)
    .select("id, name, qualified_team_a_id, qualified_team_b_id")
    .single();

  if (error) {
    throw new Error(
      `Error actualizando grupo ${group.groupName}: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(`No se encontró ningún grupo con id ${group.groupId}`);
  }

  return data;
}

export async function getGroupWithQualifiedTeamsById(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, qualified_team_a_id, qualified_team_b_id")
    .eq("id", groupId)
    .single();

  if (error) {
    throw new Error(`No se pudo cargar el grupo ${groupId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No existe ningún grupo con id ${groupId}`);
  }

  if (!data.qualified_team_a_id || !data.qualified_team_b_id) {
    throw new Error(`El grupo ${data.name} todavía no tiene clasificados`);
  }

  return data;
}

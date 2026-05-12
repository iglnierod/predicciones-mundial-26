import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";

export async function getGroupPredictions() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("groups_predictions").select("*");

  if (error) {
    console.error(
      `No se pudieron cargar las predicciones de grupos: ${error.message}`,
    );
  }

  return data ?? [];
}

export type GroupPredictionRow = {
  id: number;
  user_id: string;
  group_id: number;
  team_a_id: number;
  team_b_id: number;
};

export async function getGruopPredictionsByGroupId(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { data, error } = await supabase
    .from("group_predictions")
    .select("id, user_id, group_id, team_a_id, team_b_id")
    .eq("group_id", groupId);

  if (error) {
    throw new Error(
      `No se pudieron cargar las predicciones del grupo ${groupId}: ${error.message}`,
    );
  }

  return (data ?? []) as GroupPredictionRow[];
}

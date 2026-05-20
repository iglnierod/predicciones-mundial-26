"use server";

import { revalidatePath } from "next/cache";
import type { GroupPredictionSelection } from "@/types";
import { createClient } from "@/lib/supabase/server";
import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";

type SaveGroupPredictionsInput = {
  selection: GroupPredictionSelection;
};

export async function saveGroupPredictions({
  selection,
}: SaveGroupPredictionsInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Debes iniciar sesión para guardar tus predicciones.",
    };
  }

  const closeAt = await getTournamentPredictionsCloseAt(supabase);

  if (areTournamentPredictionsClosed(closeAt)) {
    return {
      success: false,
      error: "Las predicciones de grupos están cerradas.",
    };
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id");

  if (groupsError) {
    return {
      success: false,
      error: "No se pudieron validar los grupos.",
    };
  }

  const rows = Object.entries(selection).map(([groupId, teamIds]) => ({
    user_id: user.id,
    group_id: Number(groupId),
    team_a_id: teamIds[0],
    team_b_id: teamIds[1],
  }));

  const expectedGroupIds = new Set((groups ?? []).map((group) => group.id));
  const selectedGroupIds = new Set(rows.map((row) => row.group_id));

  const hasInvalidSelection = rows.some(
    (row) =>
      !expectedGroupIds.has(row.group_id) ||
      !row.team_a_id ||
      !row.team_b_id ||
      row.team_a_id === row.team_b_id,
  );

  const hasAllGroupsSelected =
    expectedGroupIds.size > 0 &&
    selectedGroupIds.size === expectedGroupIds.size &&
    [...expectedGroupIds].every((groupId) => selectedGroupIds.has(groupId));

  if (!hasAllGroupsSelected || hasInvalidSelection) {
    return {
      success: false,
      error: "Selecciona 2 equipos por cada grupo.",
    };
  }

  const { error } = await supabase.from("group_predictions").upsert(rows, {
    onConflict: "user_id,group_id",
  });

  if (error) {
    console.error("saveGroupPredictions error:", error);

    return {
      success: false,
      error: "No se pudieron guardar las predicciones de grupos.",
    };
  }

  revalidatePath("/groups");

  return {
    success: true,
    error: null,
  };
}

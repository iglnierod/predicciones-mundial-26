"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";

type SaveGroupPredictionInput = {
  groupId: number;
  teamIds: number[];
};

export async function saveGroupPrediction({
  groupId,
  teamIds,
}: SaveGroupPredictionInput) {
  if (!Number.isInteger(groupId) || groupId <= 0) {
    return {
      success: false,
      data: null,
      error: "Grupo no válido.",
    };
  }

  if (teamIds.length !== 0 && teamIds.length !== 2) {
    return {
      success: false,
      data: null,
      error: "Selecciona 2 equipos para guardar el grupo.",
    };
  }

  if (
    teamIds.some((teamId) => !Number.isInteger(teamId) || teamId <= 0) ||
    new Set(teamIds).size !== teamIds.length
  ) {
    return {
      success: false,
      data: null,
      error: "Selección de equipos no válida.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      data: null,
      error: "Debes iniciar sesión para guardar tus predicciones.",
    };
  }

  const closeAt = await getTournamentPredictionsCloseAt(supabase);

  if (areTournamentPredictionsClosed(closeAt)) {
    return {
      success: false,
      data: null,
      error: "Las predicciones de grupos están cerradas.",
    };
  }

  if (teamIds.length === 0) {
    const { error } = await supabase
      .from("group_predictions")
      .delete()
      .eq("user_id", user.id)
      .eq("group_id", groupId);

    if (error) {
      console.error("deleteGroupPrediction error:", error);

      return {
        success: false,
        data: null,
        error: "No se pudo eliminar la predicción del grupo.",
      };
    }

    revalidatePath("/groups");

    return {
      success: true,
      data: { group_id: groupId, team_a_id: null, team_b_id: null },
      error: null,
    };
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("group_id", groupId)
    .in("id", teamIds);

  if (teamsError || (teams ?? []).length !== 2) {
    return {
      success: false,
      data: null,
      error: "Los equipos seleccionados no pertenecen a este grupo.",
    };
  }

  const { data, error } = await supabase
    .from("group_predictions")
    .upsert(
      {
        user_id: user.id,
        group_id: groupId,
        team_a_id: teamIds[0],
        team_b_id: teamIds[1],
      },
      {
        onConflict: "user_id,group_id",
      },
    )
    .select("group_id, team_a_id, team_b_id")
    .single();

  if (error || !data) {
    console.error("saveGroupPrediction error:", error);

    return {
      success: false,
      data: null,
      error: "No se pudo guardar la predicción del grupo.",
    };
  }

  revalidatePath("/groups");

  return {
    success: true,
    data,
    error: null,
  };
}

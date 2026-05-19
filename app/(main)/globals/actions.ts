"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SaveTournamentPredictionsInput = {
  userId: string;
  values: {
    world_cup_winner_team_id: number | null;
    top_scorer: string;
    top_assist: string;
    hat_trick_player: string;
    most_goals_in_a_match_team_id: number | null;
    how_many_penalty_shootouts: string;
    underdog_quarterfinal_team_id: number | null;
    spain_top_scorer: string;
    spain_top_assist: string;
    spain_red_card_player: string;
    spain_round: string;
    spain_total_goals: string;
  };
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function saveTournamentPredictions({
  userId,
  values,
}: SaveTournamentPredictionsInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No se pudo verificar el usuario autenticado.",
    };
  }

  if (user.id !== userId) {
    return {
      success: false,
      error: "No autorizado.",
    };
  }

  const payload = {
    user_id: user.id,

    world_cup_winner_team_id: values.world_cup_winner_team_id,
    top_scorer: emptyToNull(values.top_scorer),
    top_assist: emptyToNull(values.top_assist),
    hat_trick_player: emptyToNull(values.hat_trick_player),
    most_goals_in_a_match_team_id: values.most_goals_in_a_match_team_id,
    how_many_penalty_shootouts: emptyToNull(values.how_many_penalty_shootouts),
    underdog_quarterfinal_team_id: values.underdog_quarterfinal_team_id,

    spain_top_scorer: emptyToNull(values.spain_top_scorer),
    spain_top_assist: emptyToNull(values.spain_top_assist),
    spain_red_card_player: emptyToNull(values.spain_red_card_player),
    spain_round: emptyToNull(values.spain_round),
    spain_total_goals: emptyToNull(values.spain_total_goals),
  };

  const { error } = await supabase
    .from("tournament_predictions")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("saveTournamentPredictions error:", error);

    return {
      success: false,
      error: "No se pudieron guardar las predicciones globales.",
    };
  }

  revalidatePath("/globals");

  return {
    success: true,
    error: null,
  };
}

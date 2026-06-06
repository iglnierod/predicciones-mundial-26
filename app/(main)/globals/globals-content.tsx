import { createClient } from "@/lib/supabase/server";
import GlobalsForm from "@/components/globals/globals-form";
import { Team } from "@/types";
import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";
import { getScoringRulesMap } from "@/lib/scoring/rules";

export default async function GlobalsContent() {
  const supabase = await createClient();

  const [
    {
      data: { user },
      error: userError,
    },
    { data: tournamentPrediction, error: tournamentPredictionError },
    { data: teams, error: teamsError },
    closeAt,
    scoringRules,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("tournament_predictions").select("*").maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, code, flag_code, is_top10_ranking_fifa")
      .order("name"),
    getTournamentPredictionsCloseAt(supabase),
    getScoringRulesMap(supabase),
  ]);

  if (userError || !user) {
    throw new Error("No se pudo obtener el usuario autenticado");
  }

  if (tournamentPredictionError) {
    throw new Error("No se pudieron cargar las predicciones globales");
  }

  if (teamsError) {
    throw new Error("No se pudieron cargar los equipos");
  }

  return (
    <section>
      <GlobalsForm
        userId={user.id}
        initialPrediction={tournamentPrediction}
        isClosed={areTournamentPredictionsClosed(closeAt)}
        closeAt={closeAt}
        teams={(teams as Team[]) ?? []}
        scoringRules={scoringRules}
      />
    </section>
  );
}

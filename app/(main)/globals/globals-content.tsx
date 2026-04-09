import { createClient } from "@/lib/supabase/server";
import GlobalsForm from "@/components/globals/globals-form";
import { Team } from "@/types";

export default async function GlobalsContent() {
  const supabase = await createClient();

  const [
    {
      data: { user },
      error: userError,
    },
    { data: tournamentPrediction, error: tournamentPredictionError },
    { data: teams, error: teamsError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("tournament_predictions").select("*").maybeSingle(),
    supabase.from("teams").select("id, name, code, flag_code").order("name"),
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
        teams={(teams as Team[]) ?? []}
      />
    </section>
  );
}

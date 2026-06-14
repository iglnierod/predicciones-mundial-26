import { SupabaseClient } from "@supabase/supabase-js";
import { parseUtcDate } from "@/lib/format/match";

const PREDICTION_CLOSE_OFFSET_MS = 60 * 1000;

export async function getTournamentPredictionsCloseAt(
  supabase: SupabaseClient,
) {
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo calcular el cierre de predicciones globales: ${error.message}`,
    );
  }

  if (!data?.kickoff_at) return null;

  return new Date(
    parseUtcDate(data.kickoff_at).getTime() - PREDICTION_CLOSE_OFFSET_MS,
  ).toISOString();
}

export function areTournamentPredictionsClosed(
  closeAt: string | null,
  now = new Date(),
) {
  if (!closeAt) return false;

  return now.getTime() >= new Date(closeAt).getTime();
}

import MatchesList from "@/components/matches-list";
import { createClient } from "@/lib/supabase/server";
import { MatchWithPrediction } from "@/types";

const PAGE_SIZE = 9;

export default async function MatchesContent() {
  const supabase = await createClient();

  const { data: matches, error: matchesError } = await supabase
    .from("matches_with_user_prediction")
    .select("*")
    .in("status", ["scheduled", "live"])
    .order("kickoff_at", { ascending: true })
    .range(0, PAGE_SIZE - 1);

  if (matchesError) {
    throw new Error(
      `No se pudieron cargar los partidos: ${matchesError.message}`,
    );
  }

  return (
    <MatchesList
      initialMatches={(matches ?? []) as MatchWithPrediction[]}
      pageSize={PAGE_SIZE}
    />
  );
}

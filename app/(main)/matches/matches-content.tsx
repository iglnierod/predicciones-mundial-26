import MatchRow from "@/components/match-card";
import { createClient } from "@/lib/supabase/server";
import { Match } from "@/types";

export default async function MatchesContent() {
  const supabase = await createClient();

  const { data: matches, error: matchesError } = await supabase
    .from("matches_with_details")
    .select("*")
    .order("kickoff_at", { ascending: true })
    .range(0, 8);

  if (matchesError) {
    throw new Error("No se pudieron cargar los partidos");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches?.map((match: Match) => (
        <MatchRow key={match.id} match={match} />
      ))}
    </div>
  );
}

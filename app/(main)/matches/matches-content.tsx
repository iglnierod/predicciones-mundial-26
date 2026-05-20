import MatchesList from "@/components/matches/matches-list";
import { createClient } from "@/lib/supabase/server";
import { MatchWithPrediction } from "@/types";

const PAGE_SIZE = 9;

type MatchFilter = "scheduled" | "completed";

type Props = {
  initialTab?: string;
};

function getInitialFilter(tab: string | undefined): MatchFilter {
  return tab === "played" ? "completed" : "scheduled";
}

export default async function MatchesContent({ initialTab }: Props) {
  const initialFilter = getInitialFilter(initialTab);
  const supabase = await createClient();

  let query = supabase
    .from("matches_with_user_prediction")
    .select("*")
    .order("kickoff_at", { ascending: initialFilter === "scheduled" });

  if (initialFilter === "scheduled") {
    query = query.in("status", ["scheduled", "live"]);
  } else {
    query = query.eq("status", "completed");
  }

  const { data: matches, error: matchesError } = await query.range(
    0,
    PAGE_SIZE - 1,
  );

  if (matchesError) {
    throw new Error(
      `No se pudieron cargar los partidos: ${matchesError.message}`,
    );
  }

  return (
    <MatchesList
      initialMatches={(matches ?? []) as MatchWithPrediction[]}
      initialFilter={initialFilter}
      pageSize={PAGE_SIZE}
    />
  );
}

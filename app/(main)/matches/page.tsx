import MatchRow from "@/components/match-card";
import { createClient } from "@/lib/supabase/server";
import { Match } from "@/types";

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches, error: matchesError } = await supabase
    .from("matches_with_details")
    .select("*")
    .order("kickoff_at", { ascending: true })
    .range(0, 8); // Paginación de 10 en 10

  if (matchesError) {
    throw new Error("No se pudieron cargar los partidos");
  }

  console.log(matches);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">PARTIDOS</h1>
        <p className="text-lg text-white/70">
          Consulta los partidos y haz tus predicciones.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {matches?.map((match: Match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

import { createClient } from "@/lib/supabase/server";
import AdminContent from "./admin-content";
import { GroupWithQualifiedTeams, MatchWithDetails } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();

  // Consulta grupos
  const { data: groups, error: groupsError } = await supabase
    .from("groups_with_qualified_teams")
    .select("*")
    .order("name", { ascending: true });

  if (groupsError) {
    throw new Error(`No se pudieron cargar los grupos: ${groupsError.message}`);
  }

  // Consulta partidos
  const { data: matches, error: matchesError } = await supabase
    .from("matches_with_details")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (matchesError) {
    throw new Error(
      `No se pudieron cargar los partidos: ${matchesError.message}`,
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">ADMINISTRACIÓN</h1>

        <p className="text-lg text-white/70">
          Gestiona partidos, grupos y resultados globales del torneo.
        </p>
      </div>

      <AdminContent
        initialGroups={(groups ?? []) as GroupWithQualifiedTeams[]}
        initialMatches={(matches ?? []) as MatchWithDetails[]}
      />
    </section>
  );
}

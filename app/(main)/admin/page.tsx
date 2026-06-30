import { createClient } from "@/lib/supabase/server";
import AdminContent from "./admin-content";
import { GroupWithQualifiedTeams, MatchWithDetails } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAdminGlobalPredictionsData,
  type AdminGlobalPredictionsData,
} from "@/lib/repositories/tournament-predictions-repository";
import { getScoringRulesMap } from "@/lib/scoring/rules";
import type { ScoringRulesMap } from "@/lib/scoring/types";

type AdminTab = "matches" | "groups" | "globals";

type Props = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

function getInitialTab(tab: string | undefined): AdminTab {
  if (tab === "groups") return "groups";
  if (tab === "globals") return "globals";
  return "matches";
}

export default async function AdminPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const initialTab = getInitialTab(tab);
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

  let initialGlobalData: AdminGlobalPredictionsData = {
    result: null,
    teams: [],
    predictions: [],
  };
  let scoringRules: ScoringRulesMap = {};

  if (initialTab === "globals") {
    const supabaseAdmin = createSupabaseAdminClient();

    [initialGlobalData, scoringRules] = await Promise.all([
      getAdminGlobalPredictionsData(supabaseAdmin),
      getScoringRulesMap(supabaseAdmin),
    ]);
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
        initialGlobalData={initialGlobalData}
        scoringRules={scoringRules}
        initialTab={initialTab}
      />
    </section>
  );
}

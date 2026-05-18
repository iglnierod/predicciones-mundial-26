import { SupabaseClient } from "@supabase/supabase-js";
import { getCompletedUncalculatedMatches } from "../repositories/matches-repository";
import { calculateMatchPoints } from "./calcultate-match-points";

export async function calculatePlayedMatchPoints(supabase: SupabaseClient) {
  const matches = await getCompletedUncalculatedMatches(supabase);

  let calculatedMatches = 0;
  let skippedMatches = 0;
  let failedMatches = 0;

  const results: {
    matchId: number;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const match of matches) {
    try {
      await calculateMatchPoints(supabase, match.id, {
        force: false,
      });

      calculatedMatches++;

      results.push({
        matchId: match.id,
        ok: true,
      });
    } catch (error) {
      failedMatches++;

      results.push({
        matchId: match.id,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  skippedMatches = matches.length - calculatedMatches - failedMatches;

  return {
    totalFound: matches.length,
    calculatedMatches,
    skippedMatches,
    failedMatches,
    results,
  };
}

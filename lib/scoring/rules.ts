import { SupabaseClient } from "@supabase/supabase-js";
import { ScoringRulesMap } from "./types";

export async function getScoringRulesMap(
  supabase: SupabaseClient,
): Promise<ScoringRulesMap> {
  const { data: rules, error: rulesError } = await supabase
    .from("scoring_rules")
    .select("key, points");

  if (rulesError) {
    throw new Error(`Error loading scoring rules: ${rulesError.message}`);
  }

  const map: ScoringRulesMap = {};

  rules.map((rule) => {
    map[rule.key] = rule.points;
  });

  return map;
}

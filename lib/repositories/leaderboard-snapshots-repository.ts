import { SupabaseClient } from "@supabase/supabase-js";

type CreateLeaderboardSnapshotInput = {
  sourceType: string;
  sourceId?: string | number | null;
};

export async function createLeaderboardSnapshot(
  supabase: SupabaseClient,
  input: CreateLeaderboardSnapshotInput,
) {
  const { data: snapshot, error: snapshotError } = await supabase
    .from("leaderboard_snapshots")
    .insert({
      source_type: input.sourceType,
      source_id: input.sourceId == null ? null : String(input.sourceId),
    })
    .select("id")
    .single();

  if (snapshotError) {
    throw new Error(
      `Error creating leaderboard snapshot: ${snapshotError.message}`,
    );
  }

  const { data: leaderboard, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select(
      `user_id, rank, group_points, match_points,
      extra_points, tournament_points, total_points`,
    )
    .order("rank", { ascending: true });

  if (leaderboardError) {
    throw new Error(
      `Error loading leaderboard for snapshot ${snapshot.id}: ${leaderboardError.message}`,
    );
  }

  const entries = (leaderboard ?? []).map((row) => ({
    snapshot_id: snapshot.id,
    user_id: row.user_id,
    rank: row.rank,
    group_points: row.group_points,
    match_points: row.match_points,
    extra_points: row.extra_points,
    tournament_points: row.tournament_points,
    total_points: row.total_points,
  }));

  if (entries.length === 0) {
    return {
      snapshotId: snapshot.id,
      entriesCreated: 0,
    };
  }

  const { error: entriesError } = await supabase
    .from("leaderboard_snapshot_entries")
    .insert(entries);

  if (entriesError) {
    throw new Error(
      `Error creating leaderboard snapshot entries for snapshot ${snapshot.id}: ${entriesError.message}`,
    );
  }

  return {
    snapshotId: snapshot.id,
    entriesCreated: entries.length,
  };
}

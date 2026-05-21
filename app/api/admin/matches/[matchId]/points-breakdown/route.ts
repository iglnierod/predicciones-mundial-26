import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
  try {
    await requireAdmin();

    const { matchId: matchIdParam } = await context.params;
    const matchId = Number(matchIdParam);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "matchId inválido",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("match_predictions_result_overview")
      .select(
        `
          id,
          user_id,
          full_name,
          predicted_home_score,
          predicted_away_score,
          points,
          is_calculated,
          breakdown
        `,
      )
      .eq("match_id", matchId)
      .order("points", { ascending: false, nullsFirst: false })
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      predictions: data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: "No autenticado",
        },
        { status: 401 },
      );
    }

    if (message === "Forbidden") {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

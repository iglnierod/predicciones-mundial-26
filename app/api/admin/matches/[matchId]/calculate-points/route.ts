import { requireAdmin } from "@/lib/auth/admin";
import { calculateMatchPoints } from "@/lib/scoring/calculate-match-points";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    const supabaseAdmin = createSupabaseAdminClient();

    const result = await calculateMatchPoints(supabaseAdmin, matchId, {
      force,
    });

    return NextResponse.json({
      success: true,
      result,
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

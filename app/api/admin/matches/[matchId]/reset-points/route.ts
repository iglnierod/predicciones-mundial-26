import { requireAdmin } from "@/lib/auth/admin";
import { resetMatchPoints } from "@/lib/scoring/reset-match-points";
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

    const supabaseAdmin = createSupabaseAdminClient();

    const result = await resetMatchPoints(supabaseAdmin, matchId);

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
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

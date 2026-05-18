import { requireAdmin } from "@/lib/auth/admin";
import { syncSingleMatchFromApi } from "@/lib/scoring/fetch-and-save-matchecs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
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
          ok: false,
          error: "matchId inválido",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const result = await syncSingleMatchFromApi(supabaseAdmin, matchId);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized") {
      return NextResponse.json(
        {
          ok: false,
          error: "No autenticado",
        },
        { status: 401 },
      );
    }

    if (message === "Forbidden") {
      return NextResponse.json(
        {
          ok: false,
          error: "No autorizado",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

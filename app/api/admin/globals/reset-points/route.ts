import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { resetTournamentPoints } from "@/lib/scoring/reset-tournament-points";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    await requireAdmin();

    const supabaseAdmin = createSupabaseAdminClient();
    const result = await resetTournamentPoints(supabaseAdmin);

    revalidatePath("/admin");
    revalidatePath("/leaderboard");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    if (message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
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

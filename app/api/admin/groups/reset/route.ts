import { requireAdmin } from "@/lib/auth/admin";
import { resetGroupQualifiedTeams } from "@/lib/repositories/groups-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireAdmin();

    const adminSupabase = createSupabaseAdminClient();

    const result = await resetGroupQualifiedTeams(adminSupabase);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al resetear los grupos",
      },
      { status: 500 },
    );
  }
}

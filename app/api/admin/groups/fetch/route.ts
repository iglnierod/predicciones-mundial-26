import { requireAdmin } from "@/lib/auth/admin";
import { fetchAndSaveQualifiedGroups } from "@/lib/scoring/fetch-and-save-qualified-groups";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireAdmin();

    const supabase = createSupabaseAdminClient();

    const result = await fetchAndSaveQualifiedGroups(supabase);

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
            : "Error inesperado al actualizar los grupos",
      },
      { status: 500 },
    );
  }
}

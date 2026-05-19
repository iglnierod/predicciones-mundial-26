import { requireAdmin } from "@/lib/auth/admin";
import { resetAllGroups } from "@/lib/scoring/reset-all-groups";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireAdmin();

    const supabaseAdmin = createSupabaseAdminClient();

    const result = await resetAllGroups(supabaseAdmin);

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

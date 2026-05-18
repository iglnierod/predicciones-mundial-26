import { requireAdmin } from "@/lib/auth/admin";
import { resetSingleGroup } from "@/lib/scoring/reset-single-group";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  try {
    await requireAdmin();

    const { groupId: groupIdParam } = await context.params;
    const groupId = Number(groupIdParam);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return NextResponse.json(
        {
          error: "ID de grupo no válido",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const result = await resetSingleGroup(supabase, groupId);

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
            : "Error inesperado al resetear el grupo",
      },
      { status: 500 },
    );
  }
}

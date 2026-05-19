import { requireAdmin } from "@/lib/auth/admin";
import { calculateSingleGroupPoints } from "@/lib/scoring/calculate-single-group-points";
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
          success: false,
          error: "ID de grupo no válido",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const result = await calculateSingleGroupPoints(supabase, groupId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al calcular los puntos del grupo",
      },
      { status: 500 },
    );
  }
}

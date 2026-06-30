import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { TOURNAMENT_PREDICTION_FIELDS } from "@/lib/predictions/tournament-fields";
import {
  saveTournamentResult,
  type SaveTournamentResultInput,
} from "@/lib/repositories/tournament-predictions-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTournamentResultValues(
  input: unknown,
): SaveTournamentResultInput {
  if (!isRecord(input)) {
    throw new Error("Payload de resultados globales no válido.");
  }

  const values: Record<string, string | number | null> = {};

  for (const field of TOURNAMENT_PREDICTION_FIELDS) {
    const rawValue = input[field.name];

    if (field.type === "team-select") {
      if (rawValue == null || rawValue === "") {
        values[field.name] = null;
        continue;
      }

      const teamId = Number(rawValue);

      if (!Number.isInteger(teamId) || teamId <= 0) {
        throw new Error(`Equipo no válido para ${field.label}.`);
      }

      values[field.name] = teamId;
      continue;
    }

    if (field.type === "select") {
      const selectedValue = typeof rawValue === "string" ? rawValue.trim() : "";

      if (selectedValue === "") {
        values[field.name] = null;
        continue;
      }

      if (!field.options.some((option) => option.value === selectedValue)) {
        throw new Error(`Opción no válida para ${field.label}.`);
      }

      values[field.name] = selectedValue;
      continue;
    }

    if (rawValue == null) {
      values[field.name] = null;
      continue;
    }

    if (typeof rawValue !== "string") {
      throw new Error(`Texto no válido para ${field.label}.`);
    }

    values[field.name] = rawValue.trim() === "" ? null : rawValue.trim();
  }

  return values as SaveTournamentResultInput;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const values = parseTournamentResultValues(body?.values);
    const supabaseAdmin = createSupabaseAdminClient();
    const result = await saveTournamentResult(supabaseAdmin, values);

    revalidatePath("/admin");

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

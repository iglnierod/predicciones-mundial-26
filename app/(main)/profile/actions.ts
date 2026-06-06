"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function deleteCurrentUserAccount() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No se pudo verificar el usuario autenticado.",
    };
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("deleteCurrentUserAccount error:", error);

      return {
        success: false,
        error: "No se pudo eliminar la cuenta.",
      };
    }

    await supabase.auth.signOut();

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("deleteCurrentUserAccount unexpected error:", error);

    return {
      success: false,
      error: "Error inesperado eliminando la cuenta.",
    };
  }
}

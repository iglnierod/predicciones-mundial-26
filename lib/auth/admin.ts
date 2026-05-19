import { AuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  let user = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    user = data.user;
  } catch (error) {
    if (error instanceof AuthSessionMissingError) {
      throw new Error("Unauthorized");
    }

    throw error;
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    throw new Error("Forbidden");
  }

  return { user, profile };
}

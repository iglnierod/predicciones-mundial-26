"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/protected`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <button
      type="button"
      className="z-50 flex items-center gap-3 rounded-full bg-white px-6 py-3 font-medium text-black shadow-lg transition hover:scale-[1.02] hover:bg-gray-100"
      onClick={handleGoogleLogin}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold">
        G
      </span>
      Iniciar sesión con Google
    </button>
  );
}

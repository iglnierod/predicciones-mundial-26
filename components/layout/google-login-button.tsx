"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type GoogleLoginButtonProps = {
  label?: string;
  size?: "default" | "compact";
};

export default function GoogleLoginButton({
  label = "Iniciar sesión con Google",
  size = "default",
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/home`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
      setIsLoading(false);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    setIsLoading(false);
  };

  const sizeClasses =
    size === "compact"
      ? "min-h-11 px-4 py-2 text-sm"
      : "min-h-14 px-6 py-3 text-base sm:px-7 sm:py-4";

  return (
    <button
      type="button"
      className={`group inline-flex cursor-pointer items-center justify-center gap-3 rounded-full border border-slate-200 bg-white font-black text-slate-800 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_22px_54px_rgba(15,23,42,0.25)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#3CAC3B] active:translate-y-0 disabled:cursor-wait disabled:opacity-75 ${sizeClasses}`}
      onClick={handleGoogleLogin}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
            fill="#EA4335"
          />
        </svg>
      </span>
      {isLoading ? "Conectando..." : label}
    </button>
  );
}

import GoogleLoginButton from "@/components/google-login-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
// import AutoLoginToast from "@/components/auto-login-toast";
// import Swal from "sweetalert2";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/matches");
  }

  return (
    <>
      {/* Ejemplo de como usar un toast con sweetalert2 */}
      {/* <AutoLoginToast
        shouldShow={!!user}
        userName={user?.user_metadata?.full_name}
      /> */}

      <main className="bg-ball flex min-h-dvh w-full items-center justify-center px-6">
        <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/45 px-8 py-12 text-center shadow-2xl backdrop-blur-md">
          <p className="text-sm tracking-[0.3em] text-white/70 uppercase">
            FIFA World Cup 2026
          </p>

          <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">
            Predicciones Mundial 2026
          </h1>

          <p className="mt-6 text-base leading-7 text-gray-200 md:text-lg">
            Crea tus predicciones sobre partidos, clasificaciones de grupos y
            otros eventos del Mundial de Fútbol 2026 en una sola plataforma, de
            forma simple y visual.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <GoogleLoginButton />

            <p className="text-sm text-white/70">
              Próximamente podrás guardar tus predicciones y compararlas con las
              de otros usuarios.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

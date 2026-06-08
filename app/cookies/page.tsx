import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de cookies | Predicciones Mundial 2026",
  description:
    "Informacion sobre cookies tecnicas, sesiones de usuario y analitica en Predicciones Mundial 2026.",
};

const cookieTypes = [
  {
    title: "Cookies tecnicas de sesion",
    description:
      "Permiten mantener tu sesion iniciada, comprobar que eres un usuario autenticado y proteger las zonas privadas de la app.",
    required: "Necesarias",
  },
  {
    title: "Autenticacion con Supabase",
    description:
      "Supabase puede crear cookies con prefijo sb- para conservar la sesion y renovar el acceso de forma segura.",
    required: "Necesarias",
  },
  {
    title: "Analitica agregada de Vercel",
    description:
      "Vercel Analytics permite ver metricas generales de uso sin utilizar cookies publicitarias ni perfiles comerciales.",
    required: "Medicion agregada",
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#071136] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(60,172,59,0.32),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(230,29,37,0.24),transparent_28%),linear-gradient(135deg,#2A398D_0%,#101b55_42%,#071136_100%)]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-white transition hover:text-white/80"
          >
            MUNDIAL 2026
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold text-white/75">
            <Link href="/privacy" className="transition hover:text-white">
              Privacidad
            </Link>
            <Link href="/" className="transition hover:text-white">
              Volver al inicio
            </Link>
          </nav>
        </header>

        <article className="rounded-[2.5rem] border border-white/15 bg-white/10 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-10">
          <p className="text-sm font-black tracking-[0.18em] text-[#D1D4D1] uppercase">
            Informacion legal
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-balance text-white md:text-6xl">
            Politica de cookies
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            Esta pagina explica que cookies y tecnologias similares pueden
            usarse en Predicciones Mundial 2026.
          </p>
          <p className="mt-4 text-sm font-semibold text-white/55">
            Ultima actualizacion: 8 de junio de 2026
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-white/76 sm:text-base">
            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Resumen
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  La app usa cookies tecnicas necesarias para iniciar sesion y
                  mantener la cuenta activa. Sin ellas, no se puede garantizar
                  el acceso a las zonas privadas ni guardar predicciones
                  correctamente.
                </p>
                <p>
                  No se usan cookies publicitarias, pixels de marketing ni
                  seguimiento comercial entre sitios.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Tipos de cookies y tecnologias utilizadas
              </h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {cookieTypes.map((item) => (
                  <div
                    key={item.title}
                    className="border-l-2 border-[#3CAC3B] pl-4"
                  >
                    <div className="flex flex-col gap-2">
                      <h3 className="font-black text-white">{item.title}</h3>
                      <span className="w-fit rounded-full bg-white/12 px-3 py-1 text-xs font-black tracking-wide text-[#D1D4D1] uppercase">
                        {item.required}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/68">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Cookies de autenticacion
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  El inicio de sesion se realiza con Google OAuth y Supabase.
                  Durante ese proceso se almacenan datos tecnicos de sesion para
                  recordar que has iniciado sesion y permitir que la app
                  consulte tus datos de forma segura.
                </p>
                <p>
                  Estas cookies son necesarias para prestar el servicio
                  solicitado por el usuario, por lo que no se muestra un banner
                  de consentimiento para aceptarlas o rechazarlas.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Vercel Analytics
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  La app incluye Vercel Analytics para conocer estadisticas
                  agregadas, como visitas por pagina, paises, navegadores o
                  dispositivos. Esta informacion ayuda a mejorar la aplicacion y
                  detectar errores de uso.
                </p>
                <p>
                  No se utiliza para mostrar publicidad personalizada ni para
                  vender informacion de usuarios.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Como bloquear o eliminar cookies
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  Puedes configurar tu navegador para bloquear o eliminar
                  cookies. Si bloqueas las cookies tecnicas de sesion, es
                  posible que no puedas iniciar sesion, mantener tu cuenta
                  abierta o guardar tus predicciones.
                </p>
                <p>
                  Para mas informacion sobre datos personales, consulta la{" "}
                  <Link
                    href="/privacy"
                    className="font-black text-white underline decoration-[#3CAC3B] decoration-2 underline-offset-4 transition hover:text-[#D1D4D1]"
                  >
                    politica de privacidad
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

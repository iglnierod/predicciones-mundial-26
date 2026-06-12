import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | Predicciones Mundial 2026",
  description:
    "Información sobre el tratamiento de datos personales en Predicciones Mundial 2026.",
};

const dataItems = [
  "Datos de autenticación de Google, como email, nombre y avatar.",
  "Identificador interno de usuario necesario para asociar tus predicciones.",
  "Predicciones de partidos, grupos y pronósticos globales que guardes en la app.",
  "Puntos, posición en la clasificación y datos derivados del funcionamiento de la porra.",
  "Fechas técnicas vinculadas a la cuenta, como alta o último acceso cuando están disponibles.",
];

const providers = [
  {
    name: "Supabase",
    description:
      "Gestiona la autenticación, las sesiones y la base de datos de la aplicación.",
  },
  {
    name: "Google OAuth",
    description:
      "Permite iniciar sesión con tu cuenta de Google y compartir los datos básicos necesarios para crear la cuenta en la app.",
  },
  {
    name: "Vercel",
    description:
      "Aloja la aplicación y proporciona analítica agregada para entender el uso general del sitio.",
  },
];

export default function PrivacyPage() {
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
            <Link href="/cookies" className="transition hover:text-white">
              Cookies
            </Link>
            <Link href="/" className="transition hover:text-white">
              Volver al inicio
            </Link>
          </nav>
        </header>

        <article className="rounded-[2.5rem] border border-white/15 bg-white/10 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-10">
          <p className="text-sm font-black tracking-[0.18em] text-[#D1D4D1] uppercase">
            Información legal
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-balance text-white md:text-6xl">
            Política de privacidad
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            Esta página explica qué datos se tratan en Predicciones Mundial
            2026, para qué se usan y cómo puedes gestionar tu cuenta.
          </p>
          <p className="mt-4 text-sm font-semibold text-white/55">
            Última actualización: 8 de junio de 2026
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-white/76 sm:text-base">
            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Responsable y contacto
              </h2>
              <p className="mt-4">
                El responsable de esta aplicación es Rodrigo Iglesias Nieto.
                Para cualquier consulta sobre privacidad puedes escribir a{" "}
                <a
                  href="mailto:iglnierod@gmail.com"
                  className="font-black text-white underline decoration-[#3CAC3B] decoration-2 underline-offset-4 transition hover:text-[#D1D4D1]"
                >
                  iglnierod@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Datos que se tratan
              </h2>
              <ul className="mt-4 space-y-3">
                {dataItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#3CAC3B]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Para qué se usan los datos
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  Los datos se usan para permitir el inicio de sesión, guardar
                  tus predicciones, calcular puntos, mostrar la clasificación y
                  mantener el funcionamiento normal de la porra.
                </p>
                <p>
                  No se venden datos personales ni se usan para publicidad
                  personalizada dentro de esta aplicación.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Proveedores utilizados
              </h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {providers.map((provider) => (
                  <div
                    key={provider.name}
                    className="border-l-2 border-[#3CAC3B] pl-4"
                  >
                    <h3 className="font-black text-white">{provider.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      {provider.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Analítica
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  La app utiliza Vercel Analytics para consultar métricas
                  agregadas de uso, como páginas visitadas, países, dispositivos
                  o navegadores. Esta información ayuda a detectar qué partes de
                  la app se usan más y a mejorar el proyecto.
                </p>
                <p>
                  Esta analítica no está pensada para identificarte
                  personalmente ni para crear perfiles publicitarios.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Conservación y eliminación
              </h2>
              <div className="mt-4 space-y-4">
                <p>
                  Los datos se conservan mientras mantengas tu cuenta activa o
                  mientras sean necesarios para el funcionamiento de la
                  competición.
                </p>
                <p>
                  Si tienes sesión iniciada, puedes ir a tu perfil y eliminar tu
                  cuenta. Esa acción borra tu perfil, predicciones y puntos de
                  forma permanente.
                </p>
              </div>
            </section>

            <section className="border-t border-white/12 pt-8">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Tus derechos
              </h2>
              <p className="mt-4">
                Puedes solicitar información sobre tus datos, pedir su
                corrección o pedir su eliminación escribiendo al email de
                contacto indicado en esta página.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

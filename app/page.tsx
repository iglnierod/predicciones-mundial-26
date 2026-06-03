import LandingLiveStats from "@/components/landing/landing-live-stats";
import GoogleLoginButton from "@/components/layout/google-login-button";
import { getLandingStats } from "@/lib/repositories/landing-stats-repository";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  CircleDotDashed,
  Flag,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";
// import AutoLoginToast from "@/components/layout/auto-login-toast";
// import Swal from "sweetalert2";

const pageTitle =
  "Predicciones Mundial 2026 | Quiniela, partidos, grupos y clasificación";
const pageDescription =
  "Haz tus predicciones del Mundial 2026, pronostica partidos, clasificados de grupos, campeón y compite en la clasificación con otros usuarios.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "Predicciones Mundial 2026",
    "quiniela Mundial 2026",
    "pronósticos Mundial 2026",
    "predicciones de partidos Mundial 2026",
    "clasificación Mundial 2026",
    "grupos Mundial 2026",
    "campeón Mundial 2026",
    "porra Mundial 2026",
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    locale: "es_ES",
    siteName: "Predicciones Mundial 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const featureCards = [
  {
    title: "Predicciones de partidos",
    kicker: "Marcadores",
    description:
      "Pronostica cada resultado del Mundial 2026 antes del cierre y guarda tu quiniela de partidos en una experiencia rápida y visual.",
    Icon: Target,
    color: "bg-[#2A398D]",
    glow: "shadow-[0_24px_70px_rgba(42,57,141,0.28)]",
  },
  {
    title: "Clasificados por grupo",
    kicker: "Grupos",
    description:
      "Elige los equipos que crees que pasarán de cada grupo y sigue cómo evoluciona tu apuesta durante el torneo.",
    Icon: Flag,
    color: "bg-[#3CAC3B]",
    glow: "shadow-[0_24px_70px_rgba(60,172,59,0.24)]",
  },
  {
    title: "Predicciones globales",
    kicker: "Campeón",
    description:
      "Apuesta por campeón, finalistas, máximos goleadores y otros pronósticos globales del Mundial de fútbol 2026.",
    Icon: Trophy,
    color: "bg-[#E61D25]",
    glow: "shadow-[0_24px_70px_rgba(230,29,37,0.24)]",
  },
  {
    title: "Clasificación de usuarios",
    kicker: "Ranking",
    description:
      "Compara puntos, revisa la clasificación y descubre quién domina la porra del Mundial 2026 jornada a jornada.",
    Icon: BarChart3,
    color: "bg-[#474A4A]",
    glow: "shadow-[0_24px_70px_rgba(71,74,74,0.24)]",
  },
];

const steps = [
  {
    title: "Inicia sesión",
    description:
      "Accede con Google en segundos y entra a tu panel privado de predicciones.",
    Icon: ShieldCheck,
  },
  {
    title: "Haz tu quiniela",
    description:
      "Completa partidos, grupos y pronósticos globales antes de que se cierren.",
    Icon: CalendarCheck,
  },
  {
    title: "Suma puntos",
    description:
      "Cada acierto se calcula según las reglas de puntuación y actualiza tu total.",
    Icon: CheckCircle2,
  },
  {
    title: "Compite con otros",
    description:
      "Sigue la clasificación y compara tus predicciones con las de otros usuarios.",
    Icon: Users,
  },
];

const previewRows = [
  { label: "Partidos", value: "104", tone: "bg-[#2A398D] text-white" },
  { label: "Grupos", value: "12", tone: "bg-[#3CAC3B] text-white" },
  { label: "Ranking", value: "Top", tone: "bg-[#E61D25] text-white" },
];

const contactLinks = [
  {
    label: "Email",
    href: "mailto:iglnierod@gmail.com",
    text: "iglnierod@gmail.com",
    icon: "/mail.svg",
  },
  {
    label: "GitHub",
    href: "https://github.com/iglnierod/predicciones-mundial-26",
    text: "github.com/iglnierod",
    icon: "/github.svg",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rodrigo-iglesias-nieto/",
    text: "Rodrigo Iglesias Nieto",
    icon: "/brand-linkedin.svg",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Predicciones Mundial 2026",
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  description: pageDescription,
  keywords:
    "Predicciones Mundial 2026, quiniela Mundial 2026, pronósticos Mundial 2026, clasificación Mundial 2026, grupos Mundial 2026",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: featureCards.map((feature) => feature.title),
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/matches");
  }

  const landingStats = await getLandingStats();

  return (
    <>
      {/* Ejemplo de como usar un toast con sweetalert2 */}
      {/* <AutoLoginToast
        shouldShow={!!user}
        userName={user?.user_metadata?.full_name}
      /> */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-dvh overflow-hidden bg-[#071136] text-white">
        <section className="relative isolate overflow-hidden px-5 py-5 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#2A398D_0%,#101b55_42%,#071136_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(60,172,59,0.42),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(230,29,37,0.34),transparent_27%),radial-gradient(circle_at_70%_78%,rgba(209,212,209,0.2),transparent_32%)]" />
          <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:58px_58px] opacity-30" />
          <div className="absolute top-24 right-[-8rem] -z-10 h-80 w-80 rounded-full border-[42px] border-[#3CAC3B]/20" />
          <div className="absolute bottom-20 left-[-10rem] -z-10 h-96 w-96 rounded-full border-[54px] border-[#E61D25]/15" />

          <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[2rem] border border-white/15 bg-white/10 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-md sm:px-5">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <Image
                  src="/favicon.png"
                  alt="Logo de Predicciones Mundial 2026"
                  width={40}
                  height={40}
                  priority
                  className="h-11 w-11 object-contain"
                />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                  MUNDIAL 2026
                </p>
                <p className="hidden text-xs font-semibold text-white/70 sm:block">
                  Quiniela y pronósticos
                </p>
              </div>
            </Link>

            <nav
              aria-label="Navegación principal"
              className="flex items-center gap-3"
            >
              <a
                href="#estadisticas"
                className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:inline-flex"
              >
                Estadísticas
              </a>
              <a
                href="#funcionalidades"
                className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:inline-flex"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:inline-flex"
              >
                Cómo funciona
              </a>
              <a
                href="#contacto"
                className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:inline-flex"
              >
                Contacto
              </a>
              <GoogleLoginButton label="Iniciar sesión" size="compact" />
            </nav>
          </header>

          <div className="mx-auto grid max-w-7xl items-center gap-12 py-16 lg:grid-cols-[1.03fr_0.97fr] lg:py-24">
            <div>
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black tracking-[0.22em] text-[#D1D4D1] uppercase shadow-lg backdrop-blur">
                Predicciones Mundial 2026
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] font-black tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
                Tu quiniela del Mundial 2026, clara, rápida y competitiva.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 font-medium text-white/75 sm:text-xl">
                Crea tus pronósticos del Mundial 2026: predice partidos,
                clasificados de grupos, campeón del torneo y compite en una
                clasificación de usuarios pensada para comparar cada acierto.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <GoogleLoginButton />
                <a
                  href="#funcionalidades"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#D1D4D1]"
                >
                  Ver funcionalidades
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                  <CheckCircle2
                    className="h-4 w-4 text-[#3CAC3B]"
                    aria-hidden
                  />
                  Acceso con Google
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                  <CheckCircle2
                    className="h-4 w-4 text-[#3CAC3B]"
                    aria-hidden
                  />
                  Pronósticos guardados
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                  <CheckCircle2
                    className="h-4 w-4 text-[#3CAC3B]"
                    aria-hidden
                  />
                  Ranking de usuarios
                </span>
              </div>
            </div>

            <aside
              aria-label="Vista previa del panel de predicciones del Mundial 2026"
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -top-8 -right-5 h-28 w-28 rounded-full bg-[#E61D25] blur-3xl" />
              <div className="absolute -bottom-8 -left-5 h-32 w-32 rounded-full bg-[#3CAC3B] blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-[#D1D4D1]/95 p-4 text-[#17202a] shadow-[0_34px_120px_rgba(0,0,0,0.42)]">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#2A398D]/15" />
                <div className="absolute top-8 right-8 h-28 w-28 rounded-full border-[18px] border-[#E61D25]/15" />

                <div className="relative rounded-[1.75rem] bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="inline-flex rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#2A398D] uppercase">
                        Panel privado
                      </p>
                      <h2 className="mt-3 text-2xl font-black tracking-tight text-[#17202a]">
                        Próximo pronóstico
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-[#2A398D] p-3 text-white shadow-lg">
                      <CircleDotDashed className="h-6 w-6" aria-hidden />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[1.5rem] bg-[#2A398D]/5 p-4">
                    <div className="text-left">
                      <p className="text-[11px] font-black tracking-wide text-[#474A4A]/70 uppercase">
                        Equipo local
                      </p>
                      <p className="mt-1 text-xl font-black text-[#2A398D]">
                        España
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#17202a] px-4 py-3 text-center text-2xl font-black text-white shadow-lg">
                      2-1
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black tracking-wide text-[#474A4A]/70 uppercase">
                        Rival
                      </p>
                      <p className="mt-1 text-xl font-black text-[#E61D25]">
                        México
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {previewRows.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-2xl bg-[#D1D4D1]/45 p-3 text-center"
                      >
                        <p className="text-[10px] font-black tracking-wide text-[#474A4A]/70 uppercase">
                          {row.label}
                        </p>
                        <p
                          className={`mt-2 rounded-xl px-3 py-2 text-lg font-black ${row.tone}`}
                        >
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.5rem] bg-[#3CAC3B]/10 p-4 ring-1 ring-[#3CAC3B]/20">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black tracking-wide text-[#3CAC3B] uppercase">
                          Clasificación
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#474A4A]">
                          Compara puntos y aciertos con otros usuarios.
                        </p>
                      </div>
                      <div className="rounded-full bg-[#3CAC3B] px-4 py-2 text-sm font-black text-white">
                        Top 10
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <LandingLiveStats stats={landingStats} />

        <section
          id="funcionalidades"
          aria-labelledby="funcionalidades-heading"
          className="bg-[#F3F4F3] px-5 py-16 text-[#17202a] sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black tracking-[0.18em] text-[#E61D25] uppercase">
                Funcionalidades
              </p>
              <h2
                id="funcionalidades-heading"
                className="mt-3 text-4xl font-black tracking-tight text-balance text-[#2A398D] md:text-5xl"
              >
                Todo lo que necesitas para jugar tu quiniela del Mundial 2026.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#474A4A]">
                En una sola plataforma puedes hacer predicciones del Mundial
                2026, seguir partidos, elegir clasificados por grupos, completar
                pronósticos globales y competir en una clasificación clara.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map(
                ({ title, kicker, description, Icon, color, glow }) => (
                  <article
                    key={title}
                    className={`group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-5 ${glow}`}
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-2 ${color}`}
                      aria-hidden
                    />
                    <div
                      className={`mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-white transition group-hover:-translate-y-1 group-hover:rotate-3`}
                    >
                      <Icon className="h-7 w-7" aria-hidden />
                    </div>
                    <p className="text-[11px] font-black tracking-[0.18em] text-[#474A4A]/60 uppercase">
                      {kicker}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-[#17202a]">
                      {title}
                    </h3>
                    <p className="mt-4 leading-7 font-medium text-[#474A4A]">
                      {description}
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          aria-labelledby="como-funciona-heading"
          className="relative overflow-hidden bg-white px-5 py-16 text-[#17202a] sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="absolute top-0 left-0 h-full w-2 bg-[linear-gradient(180deg,#2A398D,#3CAC3B,#E61D25)]" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-8">
              <p className="text-sm font-black tracking-[0.18em] text-[#3CAC3B] uppercase">
                Cómo funciona
              </p>
              <h2
                id="como-funciona-heading"
                className="mt-3 text-4xl font-black tracking-tight text-balance text-[#2A398D] md:text-5xl"
              >
                Del inicio de sesión a la clasificación en cuatro pasos.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#474A4A]">
                El objetivo es que cualquier usuario entienda rápido cómo
                entrar, hacer sus pronósticos del Mundial 2026 y competir sin
                perderse entre pantallas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map(({ title, description, Icon }, index) => (
                <article
                  key={title}
                  className="rounded-[2rem] border border-[#2A398D]/10 bg-[#F3F4F3] p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2A398D] text-white">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <span className="text-5xl leading-none font-black text-[#2A398D]/10">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-[#17202a]">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 font-medium text-[#474A4A]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#071136] px-5 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-[#D1D4D1] uppercase">
                Quiniela mundialista
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-balance text-white md:text-5xl">
                Una forma simple de seguir tus pronósticos del Mundial.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Reúne en un solo lugar tus predicciones del Mundial 2026,
                quiniela, pronósticos de partidos, fase de grupos, predicciones
                globales y clasificación de usuarios. Todo está pensado para que
                encuentres rápido qué puedes jugar y cómo comparar tus aciertos.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-md">
              <h3 className="text-2xl font-black text-white">
                Empieza tu porra del Mundial 2026
              </h3>
              <p className="mt-3 leading-7 text-white/70">
                Inicia sesión, guarda tus predicciones y revisa tu posición en
                la clasificación cuando empiece la competición.
              </p>
              <div className="mt-6">
                <GoogleLoginButton />
              </div>
            </div>
          </div>
        </section>

        <section
          id="contacto"
          aria-labelledby="contacto-heading"
          className="bg-[#F3F4F3] px-5 py-16 text-[#17202a] sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#2A398D]/10 bg-white p-6 shadow-[0_24px_80px_rgba(42,57,141,0.12)] md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-[#E61D25] uppercase">
                  Contacto
                </p>
                <h2
                  id="contacto-heading"
                  className="mt-3 text-4xl font-black tracking-tight text-balance text-[#2A398D] md:text-5xl"
                >
                  ¿Quieres hablar sobre el proyecto?
                </h2>
                <p className="mt-5 text-lg leading-8 text-[#474A4A]">
                  Puedes contactar conmigo por email o visitar mis perfiles de
                  GitHub y LinkedIn para ver el repositorio y otros proyectos.
                </p>
              </div>

              <div className="grid gap-3">
                {contactLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http") ? "noreferrer" : undefined
                    }
                    className="group flex items-center gap-4 rounded-3xl border border-[#2A398D]/10 bg-[#F3F4F3] p-4 transition hover:-translate-y-0.5 hover:border-[#2A398D]/25 hover:bg-white hover:shadow-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#3CAC3B]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2A398D] p-3 shadow-sm transition group-hover:bg-[#E61D25]">
                      <Image
                        src={link.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="h-5.5 w-5.5"
                      />
                    </span>
                    <span>
                      <span className="block text-sm font-black tracking-[0.14em] text-[#474A4A]/60 uppercase">
                        {link.label}
                      </span>
                      <span className="mt-1 block font-black text-[#17202a]">
                        {link.text}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

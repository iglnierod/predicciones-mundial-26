import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteAccountButton from "./delete-account-button";

function formatDate(value: string | null | undefined) {
  if (!value) return "No disponible";

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    "Usuario sin nombre";
  const email = profile?.email ?? user.email ?? "Sin correo";
  const avatarUrl =
    profile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold text-white">PERFIL</h1>
        <p className="max-w-2xl text-lg text-white/70">
          Información básica de tu cuenta en la app.
        </p>
      </div>

      <article className="rounded-3xl border border-black/5 bg-white/90 p-6 text-black shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`Avatar de ${name}`}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border border-black/10 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2A398D]/10 text-3xl font-black text-[#2A398D]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black tracking-tight text-black">
              {name}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-black/55">
              {email}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-black/5 p-4">
            <dt className="text-xs font-black tracking-wide text-black/45 uppercase">
              Fecha de inicio
            </dt>
            <dd className="mt-1 text-sm font-bold text-black">
              {formatDate(profile?.created_at ?? user.created_at)}
            </dd>
          </div>

          <div className="rounded-2xl bg-black/5 p-4">
            <dt className="text-xs font-black tracking-wide text-black/45 uppercase">
              Último acceso
            </dt>
            <dd className="mt-1 text-sm font-bold text-black">
              {formatDate(user.last_sign_in_at)}
            </dd>
          </div>

          <div className="rounded-2xl bg-black/5 p-4">
            <dt className="text-xs font-black tracking-wide text-black/45 uppercase">
              Proveedor
            </dt>
            <dd className="mt-1 text-sm font-bold text-black capitalize">
              {user.app_metadata?.provider ?? "No disponible"}
            </dd>
          </div>
        </dl>
      </article>

      <article className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm">
        <h2 className="text-xl font-black tracking-tight">Zona peligrosa</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-red-900/75">
          Puedes eliminar tu cuenta y toda tu información de la app. Esta acción
          borrará tus predicciones, puntos y perfil de forma permanente.
        </p>

        <div className="mt-5">
          <DeleteAccountButton />
        </div>
      </article>
    </section>
  );
}

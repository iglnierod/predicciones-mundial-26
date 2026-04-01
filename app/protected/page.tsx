import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Perfil</h1>

      <div className="mb-8 rounded-xl border p-6">
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Proveedor:</strong> {user.app_metadata?.provider}
        </p>
        <p>
          <strong>Nombre:</strong>{" "}
          {user.user_metadata?.full_name ?? "Sin nombre"}
        </p>
        <p>
          <strong>Último login:</strong> {user.last_sign_in_at ?? "N/A"}
        </p>

        {user.user_metadata?.avatar_url && (
          <div className="mt-4">
            <Image
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      <pre className="overflow-x-auto rounded-lg bg-black p-4 text-sm text-white">
        {JSON.stringify(user, null, 2)}
      </pre>
    </main>
  );
}

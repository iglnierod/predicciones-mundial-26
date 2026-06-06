"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Swal from "sweetalert2";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteCurrentUserAccount } from "./actions";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDeleteAccount() {
    const confirmation = await Swal.fire({
      title: "Eliminar cuenta",
      text: "Se eliminarán tu perfil, predicciones, puntos y toda tu información de la app. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar cuenta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2A398D",
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) return;

    startTransition(async () => {
      void Swal.fire({
        title: "Eliminando cuenta...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const result = await deleteCurrentUserAccount();

      if (!result.success) {
        void Swal.fire({
          icon: "error",
          title: "No se pudo eliminar",
          text: result.error ?? "Inténtalo de nuevo más tarde.",
          confirmButtonColor: "#2A398D",
        });
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });

      await Swal.fire({
        icon: "success",
        title: "Cuenta eliminada",
        text: "Tu información se ha eliminado correctamente.",
        confirmButtonColor: "#2A398D",
      });

      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAccount}
      disabled={isPending}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {isPending ? "ELIMINANDO..." : "ELIMINAR MI CUENTA"}
    </button>
  );
}

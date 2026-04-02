"use client";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Group } from "@/types";
import PredictGroupsModalContent from "./predict-groups-modal-content";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MySwal = withReactContent(Swal);

type Props = {
  groups: Group[];
};

export default function PredictGroupsButton({ groups }: Props) {
  const router = useRouter();

  const handleOpenModal = async () => {
    await MySwal.fire({
      title: "Predicciones de grupos",
      html: (
        <PredictGroupsModalContent
          groups={groups}
          onSubmit={async (selection) => {
            const supabase = createClient();

            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
              await Swal.fire({
                icon: "error",
                title: "Sesión no válida",
                text: "Debes iniciar sesión para guardar tus predicciones.",
                confirmButtonColor: "#2A398D",
              });
              return;
            }

            const rows = Object.entries(selection).map(
              ([groupId, teamIds]) => ({
                user_id: user.id,
                group_id: Number(groupId),
                first_team_id: teamIds[0],
                second_team_id: teamIds[1],
              }),
            );

            const { error } = await supabase
              .from("group_predictions")
              .upsert(rows, {
                onConflict: "user_id,group_id",
              });

            if (error) {
              await Swal.fire({
                icon: "error",
                title: "Error al guardar",
                text: error.message,
                confirmButtonColor: "#2A398D",
              });
              return;
            }

            Swal.close();

            router.refresh();

            await Swal.fire({
              icon: "success",
              title: "Predicciones guardadas",
              text: "Tus clasificados de grupo se han guardado correctamente.",
              confirmButtonColor: "#2A398D",
            });
          }}
        />
      ),
      width: 950,
      showConfirmButton: false,
      showCloseButton: true,
      background: "#2B2D31",
      color: "#F3F4F6",
      customClass: {
        popup: "!rounded-[28px] !p-6",
        title: "!text-white !text-2xl !font-bold",
        closeButton: "!text-white/70 hover:!text-white",
      },
    });
  };

  return (
    <button
      type="button"
      className="rounded-tr-4xl rounded-bl-4xl bg-green-900 p-4 font-semibold text-white transition hover:bg-green-700"
      onClick={handleOpenModal}
    >
      HAZ TUS PREDICCIONES
    </button>
  );
}

"use client";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Group } from "@/types";
import PredictGroupsModalContent from "./predict-groups-modal-content";
import { saveGroupPredictions } from "@/app/(main)/groups/actions";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MySwal = withReactContent(Swal);

function isCloseAtReached(closeAt: string | null) {
  if (!closeAt) return false;

  return Date.now() >= new Date(closeAt).getTime();
}

type Props = {
  groups: Group[];
  isClosed: boolean;
  closeAt: string | null;
};

export default function PredictGroupsButton({
  groups,
  isClosed,
  closeAt,
}: Props) {
  const router = useRouter();
  const [predictionsClosed, setPredictionsClosed] = useState(
    () => isClosed || isCloseAtReached(closeAt),
  );

  const closeAtText = useMemo(() => {
    if (!closeAt) return null;

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(closeAt));
  }, [closeAt]);

  useEffect(() => {
    if (!closeAt || predictionsClosed) return;

    const delay = new Date(closeAt).getTime() - Date.now();
    const timeoutId = window.setTimeout(
      () => {
        setPredictionsClosed(true);
      },
      Math.max(delay, 0),
    );

    return () => window.clearTimeout(timeoutId);
  }, [closeAt, predictionsClosed]);

  const handleOpenModal = async () => {
    if (predictionsClosed || isCloseAtReached(closeAt)) {
      setPredictionsClosed(true);

      await Swal.fire({
        icon: "error",
        title: "Predicciones cerradas",
        text: "Las predicciones de grupos están cerradas.",
        confirmButtonColor: "#2A398D",
      });
      return;
    }

    await MySwal.fire({
      title: "Predicciones de grupos",
      html: (
        <PredictGroupsModalContent
          groups={groups}
          onSubmit={async (selection) => {
            if (predictionsClosed || isCloseAtReached(closeAt)) {
              setPredictionsClosed(true);

              await Swal.fire({
                icon: "error",
                title: "Predicciones cerradas",
                text: "Las predicciones de grupos están cerradas.",
                confirmButtonColor: "#2A398D",
              });
              return;
            }

            const result = await saveGroupPredictions({ selection });

            if (!result.success) {
              await Swal.fire({
                icon: "error",
                title: "Error al guardar",
                text:
                  result.error ?? "No se pudieron guardar las predicciones.",
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
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="h-18 rounded-tr-4xl rounded-bl-4xl bg-green-900 p-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-800"
        onClick={handleOpenModal}
        disabled={predictionsClosed}
      >
        {predictionsClosed ? "PREDICCIONES CERRADAS" : "HAZ TUS PREDICCIONES"}
      </button>

      <p className="max-w-xs text-right text-sm text-white/70">
        {predictionsClosed
          ? "Las predicciones de grupos están cerradas."
          : closeAtText
            ? `Cierre: ${closeAtText}`
            : "El cierre se calculará cuando haya partidos cargados."}
      </p>
    </div>
  );
}

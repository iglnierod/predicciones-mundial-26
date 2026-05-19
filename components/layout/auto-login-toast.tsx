"use client";

import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

type AutoLoginToastProps = {
  shouldShow: boolean;
  userName: string;
};

export default function AutoLoginToast({
  shouldShow,
  userName,
}: AutoLoginToastProps) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!shouldShow || shownRef.current) return;

    shownRef.current = true;

    void Swal.fire({
      theme: "dark",
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: `Se ha iniciado sesión automáticamente. Bienvenido,${userName} `,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      showCloseButton: true,
      width: 500,
    });
  }, [shouldShow, userName]);

  return null;
}

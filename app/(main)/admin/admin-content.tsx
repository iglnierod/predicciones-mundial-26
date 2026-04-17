"use client";

import { useState } from "react";

export default function AdminContent() {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  async function handleCalculatePrediction(matchId: number) {
    setIsCalculating(true);
    const response = await fetch(
      `/api/admin/matches/${matchId}/calculate-points`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force: true }),
      },
    );

    const data = await response.json();
    console.log(data);
    setIsCalculating(false);
  }

  return (
    <>
      <button
        className="mt-4 cursor-pointer rounded-md bg-blue-800 px-4 py-3 text-white transition hover:scale-95 disabled:bg-blue-800/40"
        onClick={() => handleCalculatePrediction(218)}
        disabled={isCalculating}
      >
        {isCalculating ? "CALCULANDO..." : "CALCULAR PUNTOS KOR - CZA"}
      </button>
    </>
  );
}

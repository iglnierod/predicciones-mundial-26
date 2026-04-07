"use client";

export default function AdminContent() {
  async function handleCalculatePrediction() {}

  return (
    <>
      <button
        className="mt-4 cursor-pointer rounded-md bg-blue-800 px-4 py-3 text-white transition hover:scale-95"
        onClick={handleCalculatePrediction}
      >
        CALCULAR PUNTOS MEX - RSA
      </button>
    </>
  );
}

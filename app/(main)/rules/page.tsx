import type { ReactNode } from "react";

const matchScoring = [
  {
    item: "Resultado exacto",
    points: "5 pts",
    description: "Aciertas los goles exactos de los dos equipos.",
  },
  {
    item: "Ganador y diferencia",
    points: "3 pts",
    description:
      "Aciertas el ganador y la diferencia de goles. En empates, aciertas el empate sin resultado exacto.",
  },
  {
    item: "Solo ganador",
    points: "2 pts",
    description: "Aciertas qué equipo gana, pero no la diferencia.",
  },
  {
    item: "Goles de un equipo",
    points: "1 pt",
    description:
      "Aciertas los goles exactos de uno de los dos equipos, sin acertar ganador ni resultado exacto.",
  },
];

const groupScoring = [
  {
    item: "Cada clasificado acertado",
    points: "2 pts",
    description: "Por cada selección que aciertes como clasificada del grupo.",
  },
  {
    item: "Bonus por grupo perfecto",
    points: "1 pt",
    description:
      "Bonus adicional si aciertas las dos selecciones clasificadas.",
  },
];

const globalScoring = [
  { item: "Campeón del Mundial", points: "10 pts" },
  { item: "Máximo goleador del Mundial", points: "7 pts" },
  { item: "Máximo asistente del Mundial", points: "7 pts" },
  { item: "Jugador que hará un hat-trick", points: "5 pts" },
  { item: "Selección con más goles en un partido", points: "5 pts" },
  { item: "Número de tandas de penaltis", points: "5 pts" },
  { item: "Selección sorpresa en cuartos", points: "7 pts" },
  { item: "Máximo goleador de España", points: "5 pts" },
  { item: "Máximo asistente de España", points: "5 pts" },
  { item: "Jugador de España expulsado", points: "4 pts" },
  { item: "Ronda a la que llega España", points: "6 pts" },
  { item: "Goles totales de España", points: "4 pts" },
];

const closingRules = [
  {
    section: "Partidos",
    close: "1 minuto antes del inicio de cada partido",
    details:
      "Cada marcador se puede editar mientras el partido esté programado y no haya llegado su cierre individual.",
  },
  {
    section: "Grupos",
    close: "1 minuto antes del primer partido del Mundial",
    details:
      "Las predicciones de clasificados por grupo se bloquean para todo el torneo al comenzar la competición.",
  },
  {
    section: "Globales",
    close: "1 minuto antes del primer partido del Mundial",
    details:
      "Las predicciones globales y las específicas de España se guardan una sola vez para todo el torneo.",
  },
];

function RulesTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, string>>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#2A398D] text-white">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-black">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 text-black">
          {rows.map((row) => (
            <tr key={row[columns[0]]}>
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 align-top">
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/90 p-5 text-black shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm md:p-6">
      <h2 className="text-2xl font-black tracking-tight text-black">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </article>
  );
}

export default async function RulesPage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold text-white">REGLAS</h1>
        <p className="max-w-3xl text-lg text-white/70">
          Consulta cómo funciona la porra, cuándo se cierran las predicciones y
          cuántos puntos reparte cada acierto.
        </p>
      </div>

      <SectionCard title="Reglas generales">
        <ul className="space-y-3 text-sm leading-6 text-black/70">
          <li>
            Cada usuario puede guardar sus predicciones de partidos, grupos y
            globales mientras el apartado correspondiente siga abierto.
          </li>
          <li>
            Las predicciones se calculan con los resultados oficiales cargados
            en la app. Hasta que se calculen, los puntos pueden aparecer como
            pendientes.
          </li>
          <li>
            La clasificación ordena a los usuarios por puntos totales. Los
            puntos se dividen en grupos, partidos, extras y globales.
          </li>
          <li>
            Si una predicción no está completada antes del cierre, no suma
            puntos en ese apartado.
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="Cierre de predicciones">
        <RulesTable
          columns={["Apartado", "Cierre", "Detalle"]}
          rows={closingRules.map((rule) => ({
            Apartado: rule.section,
            Cierre: rule.close,
            Detalle: rule.details,
          }))}
        />
      </SectionCard>

      <SectionCard title="Puntuación de partidos">
        <p className="text-sm leading-6 text-black/70">
          En cada partido se aplica la mejor puntuación posible para tu
          marcador. Las categorías no se suman entre sí: si aciertas el
          resultado exacto, recibes 5 puntos por ese partido.
        </p>
        <RulesTable
          columns={["Acierto", "Puntos", "Descripción"]}
          rows={matchScoring.map((rule) => ({
            Acierto: rule.item,
            Puntos: rule.points,
            Descripción: rule.description,
          }))}
        />
      </SectionCard>

      <SectionCard title="Puntuación de grupos">
        <p className="text-sm leading-6 text-black/70">
          En cada grupo eliges dos selecciones clasificadas. El orden no
          importa: lo importante es acertar qué equipos pasan de grupo.
        </p>
        <RulesTable
          columns={["Acierto", "Puntos", "Descripción"]}
          rows={groupScoring.map((rule) => ({
            Acierto: rule.item,
            Puntos: rule.points,
            Descripción: rule.description,
          }))}
        />
      </SectionCard>

      <SectionCard title="Puntuación de predicciones globales">
        <p className="text-sm leading-6 text-black/70">
          Las predicciones globales son más difíciles y pueden decidir
          posiciones al final del torneo, pero no sustituyen el rendimiento
          acumulado en partidos y grupos.
        </p>
        <RulesTable
          columns={["Predicción", "Puntos"]}
          rows={globalScoring.map((rule) => ({
            Predicción: rule.item,
            Puntos: rule.points,
          }))}
        />
      </SectionCard>

      <SectionCard title="Clasificación">
        <p className="text-sm leading-6 text-black/70">
          La clasificación suma todos los puntos obtenidos en la app. Las
          posiciones se actualizan cuando se recalculan los resultados de
          partidos, grupos o predicciones globales.
        </p>
        <RulesTable
          columns={["Bloque", "Qué incluye"]}
          rows={[
            {
              Bloque: "Partidos",
              "Qué incluye": "Puntos por marcadores y resultados de partidos.",
            },
            {
              Bloque: "Grupos",
              "Qué incluye":
                "Puntos por selecciones clasificadas de cada grupo.",
            },
            {
              Bloque: "Globales",
              "Qué incluye":
                "Campeón, premios individuales, España y extras del torneo.",
            },
            {
              Bloque: "Total",
              "Qué incluye":
                "Suma completa usada para ordenar la clasificación.",
            },
          ]}
        />
      </SectionCard>
    </section>
  );
}

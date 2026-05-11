import AdminContent from "./admin-content";

export default function AdminPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">ADMINISTRACIÓN</h1>

        <p className="text-lg text-white/70">
          Gestiona partidos, grupos y resultados globales del torneo.
        </p>
      </div>

      <AdminContent />
    </section>
  );
}

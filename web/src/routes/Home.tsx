import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">
          Copa Mundial de la FIFA 2026
        </h2>
        <p className="text-zinc-400 text-lg">
          México • Estados Unidos • Canadá
        </p>
        <p className="text-zinc-500">
          11 de junio - 19 de julio, 2026
        </p>
      </section>

      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/groups"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Grupos</h3>
          <p className="text-sm text-zinc-400">
            Tabla de posiciones y fixtures de cada grupo
          </p>
        </Link>

        <Link
          to="/fixtures"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Fixture</h3>
          <p className="text-sm text-zinc-400">
            Todos los partidos del torneo
          </p>
        </Link>

        <Link
          to="/bracket"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Bracket</h3>
          <p className="text-sm text-zinc-400">
            Eliminatorias desde octavos hasta la final
          </p>
        </Link>

        <Link
          to="/venues"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Sedes</h3>
          <p className="text-sm text-zinc-400">
            Los 16 estadios en 3 países
          </p>
        </Link>
      </nav>
    </div>
  );
}
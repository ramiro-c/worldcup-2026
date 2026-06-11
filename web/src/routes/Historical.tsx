import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getHistoricalTournaments } from "../lib/api";

const FLAGS: Record<number, string> = {
  1930: "🇺🇾", 1934: "🇮🇹", 1938: "🇫🇷", 1950: "🇧🇷",
  1954: "🇨🇭", 1958: "🇸🇪", 1962: "🇨🇱", 1966: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  1970: "🇲🇽", 1974: "🇩🇪", 1978: "🇦🇷", 1982: "🇪🇸",
  1986: "🇲🇽", 1990: "🇮🇹", 1994: "🇺🇸", 1998: "🇫🇷",
  2002: "🇰🇷", 2006: "🇩🇪", 2010: "🇿🇦", 2014: "🇧🇷",
  2018: "🇷🇺", 2022: "🇶🇦", 2026: "🇺🇸",
};

export default function Historical() {
  const { data: tournaments, loading, error } = useAsync(getHistoricalTournaments, []);

  if (loading) {
    return <div className="text-center text-zinc-400 py-12">Cargando historial...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-12">Error: {error.message}</div>;
  }

  const byDecade = tournaments!.reduce((acc, t) => {
    const d = Math.floor(t.year / 10) * 10;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {} as Record<number, typeof tournaments>);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Historial de Mundiales</h2>
      <p className="text-zinc-400">
        Todos los torneos desde 1930 hasta 2026. Datos de openfootball (CC0).
      </p>

      {Object.entries(byDecade)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([decade, ts]) => (
          <div key={decade} className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-500">{decade}s</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ts!.map((t) => (
                <Link
                  key={t.year}
                  to={`/historical/${t.year}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{FLAGS[t.year] || "🏆"}</span>
                    <span className="text-2xl font-bold tabular-nums text-zinc-100">
                      {t.year}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t.host}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

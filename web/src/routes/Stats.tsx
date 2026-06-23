import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getTournamentStats } from "../lib/api";
import type { TournamentStats } from "../lib/types";
import { trackPageView } from "../lib/analytics";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import RetryButton from "../components/RetryButton";

const COUNTRY_FLAGS: Record<string, string> = {
  "Brazil": "🇧🇷",
  "Germany": "🇩🇪",
  "Italy": "🇮🇹",
  "Argentina": "🇦🇷",
  "Uruguay": "🇺🇾",
  "France": "🇫🇷",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Spain": "🇪🇸",
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || "🏆";
}

export default function Stats() {
  useEffect(() => { trackPageView("/stats"); }, []);

  const { data: stats, loading, error, refetch } = useAsync(getTournamentStats, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4" />
          </SkeletonCard>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <RetryButton onRetry={refetch} message="Estadísticas no disponibles" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Estadísticas Históricas</h2>
        <p className="text-zinc-400 mt-1">
          Datos agregados de todos los Mundiales desde 1930 hasta 2022.
        </p>
      </div>

      {stats.skipped_tournaments && stats.skipped_tournaments.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300/90"
        >
          No se pudieron cargar los datos de{" "}
          <span className="font-medium text-amber-200">
            {stats.skipped_tournaments.join(", ")}
          </span>
          .
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ChampionCard data={stats} />
        <BiggestWinsCard data={stats} />
        <TotalsCard data={stats} />
      </div>

      <section>
        <h3 className="text-xl font-semibold mb-4">Goleadores Históricos</h3>
        <TopScorersCard scorers={stats.top_scorers} />
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">Anfitriones</h3>
        <HostRecordsCard records={stats.host_records} />
      </section>
    </div>
  );
}

function ChampionCard({ data }: { data: TournamentStats }) {
  const top10 = data.champion_counts.slice(0, 10);
  const maxCount = top10[0]?.count || 1;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        Campeones
      </h3>
      <div className="space-y-3">
          {top10.map((entry, i) => (
          <Link
            key={entry.country}
            to={`/team/${encodeURIComponent(entry.country)}`}
            className="flex items-center gap-3 group"
          >
            <span className="w-6 text-sm text-zinc-500 tabular-nums text-right">
              {i + 1}
            </span>
            <span className="text-lg">{getFlag(entry.country)}</span>
            <span className="flex-1 text-sm text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
              {entry.country}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 rounded-full bg-emerald-500/30 overflow-hidden w-20 hidden sm:block">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums text-zinc-100 w-6 text-right">
                {entry.count}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {data.champion_counts.length > 10 && (
        <p className="text-xs text-zinc-600 mt-4 text-center">
          +{data.champion_counts.length - 10} países
        </p>
      )}
    </div>
  );
}

function BiggestWinsCard({ data }: { data: TournamentStats }) {
  const top5 = data.biggest_wins.slice(0, 5);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">💥</span>
        Mayores Goleadas
      </h3>
      <div className="space-y-3">
        {top5.map((win) => (
          <div
            key={`${win.year}-${win.team1}-${win.team2}`}
            className="border-b border-zinc-800/50 last:border-0 pb-2 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 tabular-nums">{win.year}</span>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                +{win.margin}
              </span>
            </div>
            <p className="text-sm text-zinc-200 mt-1">
              {win.team1} <span className="font-bold text-zinc-100">{win.score}</span> {win.team2}
            </p>
          </div>
        ))}
      </div>
      {data.biggest_wins.length > 5 && (
        <p className="text-xs text-zinc-600 mt-3 text-center">
          Hay {data.biggest_wins.length} goleadas de 4+ goles de diferencia
        </p>
      )}
    </div>
  );
}

function TotalsCard({ data }: { data: TournamentStats }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Totales
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-bold tabular-nums text-emerald-400">
            {data.total_goals.overall.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Goles en la historia</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-zinc-100">
            {data.total_goals.avg_per_tournament}
          </p>
          <p className="text-xs text-zinc-500">Promedio por torneo</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-zinc-100">
            {(data.champion_counts || []).length}
          </p>
          <p className="text-xs text-zinc-500">Países campeones distintos</p>
        </div>
      </div>
    </div>
  );
}

function TopScorersCard({ scorers }: { scorers: TournamentStats["top_scorers"] }) {
  const top15 = scorers.slice(0, 15);

  if (top15.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-zinc-500">Sin datos de goleadores</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
            <th className="text-left py-3 px-4 font-medium">#</th>
            <th className="text-left py-3 px-4 font-medium">Jugador</th>
            <th className="text-right py-3 px-4 font-medium">Goles</th>
            <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Torneos</th>
          </tr>
        </thead>
        <tbody>
          {top15.map((scorer, i) => (
            <tr key={`${scorer.player}-${scorer.team}`} className="border-b border-zinc-800/50 last:border-0">
              <td className="py-2.5 px-4 text-zinc-500 tabular-nums w-8">{i + 1}</td>
              <td className="py-2.5 px-4 text-zinc-200 font-medium">
                <div className="flex flex-col">
                  <span>{scorer.player}</span>
                  {scorer.team && scorer.team !== "Unknown" && (
                    <span className="text-xs text-zinc-500 font-normal">{scorer.team}</span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-bold tabular-nums text-emerald-400">
                {scorer.goals}
              </td>
              <td className="py-2.5 px-4 text-right text-zinc-500 tabular-nums hidden sm:table-cell">
                {scorer.tournaments.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HostRecordsCard({ records }: { records: TournamentStats["host_records"] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
            <th className="text-left py-3 px-4 font-medium">Año</th>
            <th className="text-left py-3 px-4 font-medium">Anfitrión</th>
            <th className="text-left py-3 px-4 font-medium">Campeón</th>
          </tr>
        </thead>
        <tbody>
          {records.filter(r => r.year < 2026).reverse().map((record) => (
            <tr
              key={record.year}
              className="border-b border-zinc-800/50 last:border-0"
            >
              <td className="py-2.5 px-4 text-zinc-400 tabular-nums">{record.year}</td>
              <td className="py-2.5 px-4">
                <span className="flex items-center gap-2">
                  {record.host}
                  {record.champion === record.host && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                      Campeón
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2.5 px-4">
                {record.champion === "—" ? (
                  <span className="text-zinc-600 flex items-center gap-2">
                    {getFlag(record.champion)}
                    <span>{record.champion}</span>
                  </span>
                ) : (
                  <Link
                    to={`/team/${encodeURIComponent(record.champion)}`}
                    className="text-zinc-200 hover:text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    {getFlag(record.champion)}
                    <span>{record.champion}</span>
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

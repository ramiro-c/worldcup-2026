import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getGroups } from "../lib/api";
import type { GroupStanding } from "../lib/types";
import { trackPageView } from "../lib/analytics";
import { Skeleton, SkeletonCard, SkeletonTable } from "../components/Skeleton";
import RetryButton from "../components/RetryButton";

function QualificationBadge({ standing }: { standing: GroupStanding }) {
  if (standing.qualification === "qualified") {
    return (
      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
        Clasificado
      </span>
    );
  }
  if (standing.qualification === "best_third") {
    return (
      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
        Mejor 3°
      </span>
    );
  }
  if (standing.qualification === "eliminated") {
    return (
      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
        Eliminado
      </span>
    );
  }
  // pending
  return (
    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-400">
      Por definir
    </span>
  );
}

function getRowHighlight(position: number, qualification: string): string {
  if (qualification === "qualified") return "bg-emerald-500/5";
  if (qualification === "best_third" && position === 3) return "bg-blue-500/5";
  if (qualification === "eliminated") return "";
  return "";
}

export default function Groups() {
  useEffect(() => { trackPageView("/groups"); }, []);

  const { data: groups, loading, error, refetch } = useAsync(async () => {
    return getGroups();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <SkeletonCard key={g}>
              <div className="border-b border-zinc-800 px-4 py-3">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="p-4">
                <SkeletonTable rows={4} columns={6} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <RetryButton onRetry={refetch} message={error.message} />;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Fase de Grupos</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups!.map(({ group, standings }) => (
          <div
            key={group.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
          >
            <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-900">
              <h3 className="font-semibold text-lg">{group.name}</h3>
            </div>

            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">Equipo</th>
                    <th className="text-center py-2 font-medium">PJ</th>
                    <th className="text-center py-2 font-medium">G</th>
                    <th className="text-center py-2 font-medium">E</th>
                    <th className="text-center py-2 font-medium">P</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">GF</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">GC</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">DG</th>
                    <th className="text-center py-2 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing) => (
                    <tr
                      key={standing.team.id}
                      className={`border-zinc-800/50 ${getRowHighlight(standing.position, standing.qualification)}`}
                    >
                      <td className="py-3 text-zinc-500">{standing.position}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={standing.team.crest}
                            alt={standing.team.name}
                            className="w-6 h-6 object-contain"
                          />
                          <Link
                            to={`/team/${encodeURIComponent(standing.team.name)}`}
                            className="font-medium hover:text-emerald-400 transition-colors"
                          >
                            {standing.team.name}
                          </Link>
                          <QualificationBadge standing={standing} />
                        </div>
                      </td>
                      <td className="text-center py-3 text-zinc-400">{standing.played}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.won}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.drawn}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.lost}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.gf}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.ga}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.gd}</td>
                      <td className="text-center py-3 font-semibold">{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Clasificado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Mejor 3°
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  Por definir
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

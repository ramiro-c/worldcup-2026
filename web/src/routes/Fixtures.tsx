import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getMatches, getTeams, getVenues } from "../lib/api";
import type { Match } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import RetryButton from "../components/RetryButton";

interface MatchWithDetails extends Match {
  home_team_name?: string;
  home_team_crest?: string;
  away_team_name?: string;
  away_team_crest?: string;
  venue_name?: string;
}

export default function Fixtures() {
  const [filter, setFilter] = useState<string>("all");
  const [shouldPoll, setShouldPoll] = useState(false);
  const { timezone } = useTimezone();

  // Static data: fetch once on mount
  const { data: teamsData } = useAsync(() => getTeams(), []);
  const { data: venuesData } = useAsync(() => getVenues(), []);

  // Dynamic data: poll while live matches exist
  const { data: matches, loading, error } = usePolling(
    (signal) => getMatches(signal),
    30000,
    shouldPoll
  );

  // Update poll condition when match data changes
  useEffect(() => {
    if (matches) {
      setShouldPoll(matches.some((m: Match) => m.status === "live"));
    }
  }, [matches]);

  // Enrich matches with team and venue info
  const enrichedMatches = useMemo(() => {
    if (!matches || !teamsData || !venuesData) return null;

    const teamMap = new Map(teamsData.map((t) => [t.id, t]));
    const venueMap = new Map(venuesData.map((v) => [v.id, v.name]));

    return matches.map((match) => {
      const home = teamMap.get(match.home_team);
      const away = teamMap.get(match.away_team);
      return {
        ...match,
        home_team_name: home?.name,
        home_team_crest: home?.crest,
        away_team_name: away?.name,
        away_team_crest: away?.crest,
        venue_name: venueMap.get(match.venue),
      };
    });
  }, [matches, teamsData, venuesData]);

  const filteredMatches = enrichedMatches?.filter((match) => {
    if (filter === "all") return true;
    if (filter === "group") return !!match.group;
    if (filter === "knockout") return !!match.round;
    return false;
  }) ?? [];

  const matchesByGroup = filteredMatches.reduce((acc, match) => {
    const key = match.group || match.round || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {} as Record<string, MatchWithDetails[]>);

  const isLoading = !enrichedMatches && (loading || !teamsData || !venuesData);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((group) => (
            <div key={group} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                {[1, 2, 3].map((match) => (
                  <SkeletonCard key={match} className="p-4 flex items-center gap-4">
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="text-center px-4">
                      <Skeleton className="h-7 w-12 mx-auto" />
                      <Skeleton className="h-3 w-20 mx-auto mt-1" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </SkeletonCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <RetryButton onRetry={() => window.location.reload()} message={error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <h2 className="text-2xl font-bold">Fixture</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("group")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "group"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Grupos
          </button>
          <button
            onClick={() => setFilter("knockout")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "knockout"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Eliminatorias
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {filteredMatches.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-400 text-lg">
              {filter === "knockout"
                ? "No hay partidos de eliminatoria disponibles aún"
                : "No hay partidos disponibles"}
            </p>
            {filter === "knockout" && (
              <p className="text-zinc-500 mt-2 text-sm">
                Los cruces se definirán cuando termine la fase de grupos
              </p>
            )}
          </div>
        )}
        {Object.entries(matchesByGroup).map(([group, groupMatches]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-300">
              {group === "other" ? "Eliminatorias" : `Grupo ${group}`}
            </h3>

            <div className="space-y-2">
              {groupMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-4"
                >
                  <div className="text-right flex-1 min-w-0">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/team/${encodeURIComponent(match.home_team_name!)}`}
                        className="font-medium truncate hover:text-emerald-400 transition-colors"
                      >
                        {match.home_team_name}
                      </Link>
                      <img
                        src={match.home_team_crest}
                        alt={match.home_team_name}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  </div>

                  <div className="text-center px-4">
                    <div className="text-2xl font-bold tabular-nums">
                      {match.status === "finished" || match.status === "live"
                        ? `${match.home_score ?? "-"} - ${match.away_score ?? "-"}`
                        : "VS"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {formatMatchTime(match.date, match.time, timezone)}
                    </div>
                    {match.status === "live" && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                        EN VIVO
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <img
                        src={match.away_team_crest}
                        alt={match.away_team_name}
                        className="w-8 h-8 object-contain"
                      />
                      <Link
                        to={`/team/${encodeURIComponent(match.away_team_name!)}`}
                        className="font-medium truncate hover:text-emerald-400 transition-colors"
                      >
                        {match.away_team_name}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

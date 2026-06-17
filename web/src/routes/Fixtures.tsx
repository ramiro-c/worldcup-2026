import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getMatches, getTeams, getVenues } from "../lib/api";
import type { Match } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import { trackPageView } from "../lib/analytics";
import FilterBar from "../components/FilterBar";
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
  useEffect(() => { trackPageView("/fixtures"); }, []);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [shouldPoll, setShouldPoll] = useState(false);
  const { timezone } = useTimezone();

  // Filter state from URL search params
  const roundFilter = searchParams.get("round") || "all";
  const teamFilter = searchParams.get("team") || "";
  const dateFilter = searchParams.get("date") || "";
  const venueFilter = searchParams.get("venue") || "";
  const statusFilter = searchParams.getAll("status");

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
    // Round filter (existing all/group/knockout)
    if (roundFilter === "group" && !match.group) return false;
    if (roundFilter === "knockout" && !match.round) return false;

    // Team filter
    if (teamFilter) {
      const teamName = teamFilter.toLowerCase();
      const home = match.home_team_name?.toLowerCase() ?? "";
      const away = match.away_team_name?.toLowerCase() ?? "";
      if (home !== teamName && away !== teamName) return false;
    }

    // Date filter
    if (dateFilter && match.date !== dateFilter) return false;

    // Venue filter
    if (venueFilter) {
      const venueName = match.venue_name?.toLowerCase() ?? "";
      if (venueName !== venueFilter.toLowerCase()) return false;
    }

    // Status filter (OR within status, AND with other filters)
    if (statusFilter.length > 0 && !statusFilter.includes(match.status)) return false;

    return true;
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

  // Helper to update a single search param
  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    }, { replace: true });
  };

  const handleStatusToggle = (status: string) => {
    setSearchParams((prev) => {
      const current = prev.getAll("status");
      if (current.includes(status)) {
        // Remove status
        const next = current.filter((s) => s !== status);
        prev.delete("status");
        next.forEach((s) => prev.append("status", s));
      } else {
        prev.append("status", status);
      }
      return prev;
    }, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const setRoundFilter = (value: string) => {
    updateParam("round", value === "all" ? "" : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h2 className="text-2xl font-bold">Fixture</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "group", "knockout"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoundFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  roundFilter === r
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {r === "all" ? "Todos" : r === "group" ? "Grupos" : "Eliminatorias"}
              </button>
            ))}
          </div>
        </div>
        {(teamsData && venuesData) && (
          <FilterBar
            teams={teamsData}
            venues={venuesData}
            teamFilter={teamFilter}
            dateFilter={dateFilter}
            venueFilter={venueFilter}
            statusFilter={statusFilter}
            onTeamChange={(v) => updateParam("team", v)}
            onDateChange={(v) => updateParam("date", v)}
            onVenueChange={(v) => updateParam("venue", v)}
            onStatusToggle={handleStatusToggle}
            onClear={clearFilters}
          />
        )}
      </div>

      <div className="space-y-8">
        {filteredMatches.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-400 text-lg">
              {roundFilter === "knockout" && !teamFilter && !dateFilter && !venueFilter && statusFilter.length === 0
                ? "No hay partidos de eliminatoria disponibles aún"
                : "No hay partidos con estos filtros"}
            </p>
            {(roundFilter === "knockout" && !teamFilter && !dateFilter && !venueFilter && statusFilter.length === 0) && (
              <p className="text-zinc-500 mt-2 text-sm">
                Los cruces se definirán cuando termine la fase de grupos
              </p>
            )}
            {(teamFilter || dateFilter || venueFilter || statusFilter.length > 0) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
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
                  onClick={() => navigate(`/match/${match.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/match/${match.id}`);
                    }
                  }}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-4 hover:border-emerald-700 transition-colors cursor-pointer"
                >
                  <div className="text-right flex-1 min-w-0">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/team/${encodeURIComponent(match.home_team_name!)}`}
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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

import { useState } from "react";
import { useAsync } from "../lib/useAsync";
import { getMatches, getTeams, getVenues } from "../lib/api";
import type { Match } from "../lib/types";

interface MatchWithDetails extends Match {
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
}

export default function Fixtures() {
  const [filter, setFilter] = useState<string>("all");

  const { data: matches, loading, error } = useAsync(async () => {
    const [matchesData, teamsData, venuesData] = await Promise.all([
      getMatches(),
      getTeams(),
      getVenues(),
    ]);

    const teamMap = new Map(teamsData.map((t) => [t.id, t.name]));
    const venueMap = new Map(venuesData.map((v) => [v.id, v.name]));

    return matchesData.map((match) => ({
      ...match,
      home_team_name: teamMap.get(match.home_team),
      away_team_name: teamMap.get(match.away_team),
      venue_name: venueMap.get(match.venue),
    }));
  }, []);

  const filteredMatches = matches?.filter((match) => {
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

  if (loading) {
    return <div className="text-center text-zinc-400 py-12">Cargando fixture...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-12">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Fixture</h2>
        <div className="flex gap-2">
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
                      <span className="font-medium truncate">
                        {match.home_team_name}
                      </span>
                      <img
                        src={getTeamCrest(match.home_team)}
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
                      {match.date} {match.time}
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
                        src={getTeamCrest(match.away_team)}
                        alt={match.away_team_name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-medium truncate">
                        {match.away_team_name}
                      </span>
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

function getTeamCrest(teamId: string) {
  return `https://wheniskickoff.com/data/v1/teams/${teamId}/crest.svg`;
}
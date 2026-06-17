import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getMatches, getTeams } from "../lib/api";
import type { Match } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";

interface LiveMatchDisplay {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore?: number;
  awayScore?: number;
  matchTime: string;
}

function LiveMatchCard({
  homeTeamName,
  awayTeamName,
  homeCrest,
  awayCrest,
  homeScore,
  awayScore,
  matchTime,
  matchId,
}: LiveMatchDisplay & { matchId: string }) {
  return (
    <Link
      to={`/match/${matchId}`}
      className="block rounded-xl border border-red-500/30 bg-red-500/5 p-4 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
    >
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold truncate">{homeTeamName}</span>
            {homeCrest && (
              <img src={homeCrest} alt={homeTeamName} className="w-6 h-6 object-contain shrink-0" />
            )}
          </div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl sm:text-2xl font-bold tabular-nums">
            {homeScore ?? "-"} - {awayScore ?? "-"}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{matchTime}</div>
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            {awayCrest && (
              <img src={awayCrest} alt={awayTeamName} className="w-6 h-6 object-contain shrink-0" />
            )}
            <span className="font-semibold truncate">{awayTeamName}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full animate-pulse">
          EN VIVO
        </span>
      </div>
    </Link>
  );
}

export default function LiveWidget() {
  const [shouldPoll, setShouldPoll] = useState(false);
  const { timezone } = useTimezone();
  const { data: teamsData } = useAsync(() => getTeams(), []);

  const { data: matches } = usePolling(
    (signal) => getMatches(signal),
    30000,
    shouldPoll,
    []
  );

  // Poll only while there are live matches
  useEffect(() => {
    if (matches) {
      setShouldPoll(matches.some((m: Match) => m.status === "live"));
    }
  }, [matches]);

  const teamMap = useMemo(() => {
    if (!teamsData) return null;
    return new Map(teamsData.map((t) => [t.id, t]));
  }, [teamsData]);

  const liveMatches = useMemo(() => {
    if (!matches || !teamMap) return null;

    const live = matches.filter((m: Match) => m.status === "live");
    if (live.length === 0) return [];

    return live.map((m: Match) => {
      const home = teamMap.get(m.home_team);
      const away = teamMap.get(m.away_team);
      return {
        id: m.id,
        homeTeamName: home?.name ?? m.home_team,
        awayTeamName: away?.name ?? m.away_team,
        homeCrest: home?.crest,
        awayCrest: away?.crest,
        homeScore: m.home_score,
        awayScore: m.away_score,
        matchTime: formatMatchTime(m.date, m.time, timezone),
      };
    });
  }, [matches, teamMap, timezone]);

  // Don't render anything while loading or when no live matches
  if (!liveMatches || liveMatches.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-red-400">En Vivo</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveMatches.map((m) => (
          <LiveMatchCard key={m.id} {...m} matchId={m.id} />
        ))}
      </div>
    </section>
  );
}

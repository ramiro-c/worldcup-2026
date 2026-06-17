import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getHeadToHead } from "../lib/api";
import type { HistoricalMatch } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import RetryButton from "../components/RetryButton";
import { Skeleton, SkeletonCard } from "../components/Skeleton";

interface WDLSummary {
  team1Wins: number;
  team2Wins: number;
  draws: number;
  total: number;
}

function computeSummary(matches: HistoricalMatch[], team1Name: string): WDLSummary {
  let team1Wins = 0;
  let team2Wins = 0;
  let draws = 0;

  for (const match of matches) {
    const t1Won = match.team1.is_winner;
    const t2Won = match.team2.is_winner;

    if (t1Won === t2Won) {
      draws++;
    } else {
      const winnerName = t1Won ? match.team1.name : match.team2.name;
      if (winnerName.toLowerCase() === team1Name.toLowerCase()) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    }
  }

  return { team1Wins, team2Wins, draws, total: matches.length };
}

function formatDate(dateStr: string | null, timezone: string): string {
  if (!dateStr) return "";
  // Historical matches have no time, formatMatchTime returns date as-is
  return formatMatchTime(dateStr, null, timezone);
}

export default function HeadToHead() {
  const { team1, team2 } = useParams<{ team1: string; team2: string }>();
  const team1Name = decodeURIComponent(team1 ?? "");
  const team2Name = decodeURIComponent(team2 ?? "");
  const { timezone } = useTimezone();

  const { data: matches, loading, error, refetch } = useAsync(
    () => getHeadToHead(team1Name, team2Name),
    [team1Name, team2Name]
  );

  const summary = useMemo(() => {
    if (!matches) return null;
    return computeSummary(matches, team1Name);
  }, [matches, team1Name, team2Name]);

  const last5 = useMemo(() => {
    if (!matches) return [];
    return [...matches]
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      })
      .slice(-5)
      .reverse();
  }, [matches]);

  const results = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }, [matches]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-6">
              <Skeleton className="h-4 w-16 mx-auto mb-3" />
              <Skeleton className="h-8 w-12 mx-auto" />
            </SkeletonCard>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4">
              <Skeleton className="h-5 w-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Error al cargar</h1>
        <p className="text-zinc-500">
          No se pudo cargar el historial entre {team1Name} y {team2Name}.
        </p>
        <RetryButton onRetry={refetch} message={error.message} />
        <div>
          <Link
            to="/historical"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
          >
            Volver al historial
          </Link>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Sin enfrentamientos</h1>
        <p className="text-zinc-500">
          {team1Name} y {team2Name} no se han enfrentado en mundiales anteriores.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to={`/team/${encodeURIComponent(team1Name)}`}
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
          >
            {team1Name}
          </Link>
          <Link
            to={`/team/${encodeURIComponent(team2Name)}`}
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
          >
            {team2Name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/historical"
          className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          &larr; Historial
        </Link>
      </div>

      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">
          {team1Name} vs {team2Name}
        </h2>
        <p className="text-zinc-400 mt-1">
          {summary!.total} partidos en Mundiales
        </p>
      </div>

      {/* W/D/L Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <div className="text-sm text-emerald-400 font-medium mb-1">{team1Name}</div>
          <div className="text-3xl font-bold text-emerald-400">{summary!.team1Wins}</div>
          <div className="text-xs text-zinc-500 mt-1">Victorias</div>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6 text-center">
          <div className="text-sm text-zinc-400 font-medium mb-1">Empates</div>
          <div className="text-3xl font-bold text-zinc-300">{summary!.draws}</div>
          <div className="text-xs text-zinc-500 mt-1">Partidos</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 text-center">
          <div className="text-sm text-blue-400 font-medium mb-1">{team2Name}</div>
          <div className="text-3xl font-bold text-blue-400">{summary!.team2Wins}</div>
          <div className="text-xs text-zinc-500 mt-1">Victorias</div>
        </div>
      </div>

      {/* Last 5 matches */}
      {last5.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-zinc-300">Últimos 5 enfrentamientos</h3>
          <div className="space-y-2">
            {last5.map((match, i) => (
              <MatchResultRow key={i} match={match} timezone={timezone} />
            ))}
          </div>
        </section>
      )}

      {/* Full results */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-300">Todos los resultados</h3>
        <div className="space-y-2">
          {results.map((match, i) => (
            <MatchResultRow key={i} match={match} timezone={timezone} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchResultRow({ match, timezone }: { match: HistoricalMatch; timezone: string }) {
  const isTeam1Winner = match.team1.is_winner;
  const isTeam2Winner = match.team2.is_winner;

  const team1Class = isTeam1Winner
    ? "font-bold text-emerald-400"
    : isTeam2Winner
      ? "text-zinc-500"
      : "text-zinc-300";
  const team2Class = isTeam2Winner
    ? "font-bold text-emerald-400"
    : isTeam1Winner
      ? "text-zinc-500"
      : "text-zinc-300";

  return (
    <div className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
          <span className={`text-sm sm:text-base ${team1Class} flex-1 sm:flex-none text-right`}>
            {match.team1.name}
          </span>
        </div>

        <div className="text-center min-w-[80px]">
          <div className="text-xl font-bold tabular-nums text-zinc-100">{match.score}</div>
          {match.penalty_score && (
            <div className="text-xs text-zinc-500">({match.penalty_score} pen.)</div>
          )}
          {match.ht_score && (
            <div className="text-xs text-zinc-600">PT {match.ht_score}</div>
          )}
          {match.has_extra_time && <div className="text-xs text-zinc-600">t.e.</div>}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-start">
          <span className={`text-sm sm:text-base ${team2Class} flex-1 sm:flex-none text-left`}>
            {match.team2.name}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
        {match.date && <span>{formatDate(match.date, timezone)}</span>}
        {match.stage !== "group" && (
          <span className="text-zinc-500 capitalize">{match.stage.replace(/_/g, " ")}</span>
        )}
        {match.group_name && <span>Grupo {match.group_name}</span>}
        {match.venue && <span>{match.venue}</span>}
      </div>
    </div>
  );
}

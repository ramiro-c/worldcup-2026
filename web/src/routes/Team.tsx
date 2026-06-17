import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getTeamMatches } from "../lib/api";
import type { HistoricalTeamMatch } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import RetryButton from "../components/RetryButton";
import { Skeleton, SkeletonCard } from "../components/Skeleton";

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  total: number;
}

const STAGE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_16: "Octavos de Final",
  round_of_32: "Dieciseisavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Final",
};

function computeTeamStats(matches: HistoricalTeamMatch[], teamName: string): TeamStats {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;

  for (const match of matches) {
    // W/D/L
    const isTeam1 = match.team1.name.toLowerCase() === teamName.toLowerCase();
    const t1Won = match.team1.is_winner;
    const t2Won = match.team2.is_winner;

    if (t1Won === t2Won) {
      draws++;
    } else if ((isTeam1 && t1Won) || (!isTeam1 && t2Won)) {
      wins++;
    } else {
      losses++;
    }

    // Goals
    if (match.score && match.score !== "-") {
      const parts = match.score.split("-");
      if (parts.length === 2) {
        const homeGoals = parseInt(parts[0], 10);
        const awayGoals = parseInt(parts[1], 10);
        if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
          if (isTeam1) {
            gf += homeGoals;
            ga += awayGoals;
          } else {
            gf += awayGoals;
            ga += homeGoals;
          }
        }
      }
    }
  }

  return { wins, draws, losses, gf, ga, total: matches.length };
}

export default function Team() {
  const { teamName } = useParams<{ teamName: string }>();
  const { timezone } = useTimezone();
  const { data: matches, loading, error, refetch } = useAsync(
    () => getTeamMatches(teamName!),
    [teamName]
  );

  const stats = useMemo(() => {
    if (!matches || !teamName) return null;
    return computeTeamStats(matches, teamName);
  }, [matches, teamName]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-6">
          {[1, 2, 3].map((g) => (
            <div key={g} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <SkeletonCard className="p-4">
                  <Skeleton className="h-4 w-full" />
                </SkeletonCard>
                <SkeletonCard className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                </SkeletonCard>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Error al cargar</h1>
        <p className="text-zinc-500">{error.message}</p>
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
        <h1 className="text-4xl font-bold text-zinc-700">Sin partidos encontrados</h1>
        <p className="text-zinc-500">
          No se encontraron partidos para "{teamName}" en los Mundiales.
        </p>
        <Link
          to="/historical"
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
        >
          Volver al historial
        </Link>
      </div>
    );
  }

  const byYear = matches.reduce((acc, m) => {
    if (!acc[m.tournament_year]) acc[m.tournament_year] = [];
    acc[m.tournament_year].push(m);
    return acc;
  }, {} as Record<number, HistoricalTeamMatch[]>);

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div>
          <Link
            to="/historical"
            className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            &larr; Historial
          </Link>
          <h2 className="text-2xl font-bold mt-1">{teamName} en Mundiales</h2>
          <p className="text-zinc-400 text-sm">{matches.length} partidos</p>
        </div>
      </div>

      {/* Stats card */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.wins}</div>
            <div className="text-xs text-zinc-500 mt-1">Victorias</div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-300">{stats.draws}</div>
            <div className="text-xs text-zinc-500 mt-1">Empates</div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-xs text-zinc-500 mt-1">Derrotas</div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-300">{stats.gf}</div>
            <div className="text-xs text-zinc-500 mt-1">Goles a favor</div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-300">{stats.ga}</div>
            <div className="text-xs text-zinc-500 mt-1">Goles en contra</div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {years.map((year) => (
          <section key={year} className="space-y-3">
            <h3 className="text-lg font-semibold text-emerald-400">
              {byYear[year][0].tournament_name}
            </h3>
            <div className="space-y-2">
              {byYear[year].map((match, i) => (
                <MatchCard key={i} match={match} timezone={timezone} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, timezone }: { match: HistoricalTeamMatch; timezone: string }) {
  const params = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const isTeam1 = match.team1.name.toLowerCase() === params.teamName?.toLowerCase();
  const isWinner = isTeam1 ? match.team1.is_winner : match.team2.is_winner;
  const teamName = params.teamName!;
  const opponentName = isTeam1 ? match.team2.name : match.team1.name;

  return (
    <div
      onClick={() => navigate(`/historical/${match.tournament_year}/${match.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/historical/${match.tournament_year}/${match.id}`);
        }
      }}
      role="button"
      tabIndex={0}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
          <span className={`text-sm sm:text-base ${isWinner ? "font-bold text-emerald-400" : "text-zinc-400"} flex-1 sm:flex-none text-right`}>
            {match.team1.name}
          </span>
        </div>

        <div className="text-center min-w-[80px]">
          <div className="text-xl font-bold tabular-nums text-zinc-100">
            {match.score}
          </div>
          {match.penalty_score && (
            <div className="text-xs text-zinc-500">
              ({match.penalty_score} pen.)
            </div>
          )}
          {match.ht_score && (
            <div className="text-xs text-zinc-600">PT {match.ht_score}</div>
          )}
          {match.has_extra_time && (
            <div className="text-xs text-zinc-600">t.e.</div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-start">
          <span className={`text-sm sm:text-base ${!isTeam1 ? (match.team2.is_winner ? "font-bold text-emerald-400" : "text-zinc-400") : "text-zinc-400"} flex-1 sm:flex-none text-left`}>
            {match.team2.name}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
        {match.stage !== "group" && (
          <span className="text-zinc-500">{STAGE_LABELS[match.stage] || match.stage}</span>
        )}
        {match.group_name && <span>Grupo {match.group_name}</span>}
        {match.venue && <span>{match.venue}</span>}
        {match.date && <span>{formatMatchTime(match.date, null, timezone)}</span>}
        <Link
          to={`/head-to-head/${encodeURIComponent(teamName)}/${encodeURIComponent(opponentName)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
        >
          vs {opponentName}
        </Link>
      </div>

      {match.scorers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          {match.scorers.map((s, i) => (
            <span key={i}>
              {s.player} {s.minute}{s.penalty ? " (p)" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getHistoricalTournament } from "../lib/api";
import { STAGE_LABELS } from "../lib/constants";
import { trackPageView } from "../lib/analytics";
import { useNavigateBack } from "../lib/navigation";
import { Skeleton } from "../components/Skeleton";
import { StatsBombTimeline } from "../components/statsbomb/StatsBombTimeline";

export default function HistoricalMatchDetail() {
  const { year, matchId } = useParams<{ year: string; matchId: string }>();
  const goBack = useNavigateBack(`/historical/${year}`);
  useEffect(() => { trackPageView(`/historical/${year}/${matchId}`); }, [year, matchId]);

  const { data: tournament, loading, error, refetch } = useAsync(
    () => getHistoricalTournament(Number(year)),
    [year]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const match = tournament?.matches.find((m) => m.id === matchId);

  if (error || !tournament || !match) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Partido no encontrado</h1>
        <p className="text-zinc-500">Este partido no existe o el torneo no está disponible.</p>
        {error && (
          <button
            onClick={refetch}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-medium rounded-lg transition-colors"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={goBack}
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-8">
        <div className="text-center mb-6">
          {match.stage === "group" && match.group_name ? (
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              Grupo {match.group_name}
            </span>
          ) : (
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              {STAGE_LABELS[match.stage] || match.stage}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
          <div className="flex-1 text-center sm:text-right w-full sm:w-auto">
            <Link to={`/team/${encodeURIComponent(match.team1.name)}`} className={`text-xl sm:text-2xl font-bold ${match.team1.is_winner ? "text-emerald-400" : ""} hover:text-emerald-400 transition-colors block sm:inline-block`}>
              {match.team1.name}
            </Link>
            {match.team1.is_winner && <p className="text-emerald-500 text-sm font-medium mt-1">Ganador</p>}
          </div>

          <div className="text-center px-4 sm:px-8">
            <div className="text-3xl sm:text-5xl font-bold tabular-nums">
              {match.score}
            </div>
            {match.penalty_score && (
              <div className="text-sm text-zinc-500 mt-1">
                {match.penalty_score} pen.
              </div>
            )}
            {match.ht_score && (
              <div className="text-xs text-zinc-600 mt-1">PT {match.ht_score}</div>
            )}
            {match.has_extra_time && (
              <div className="text-xs text-zinc-600 mt-1">t.e.</div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
            <Link to={`/team/${encodeURIComponent(match.team2.name)}`} className={`text-xl sm:text-2xl font-bold ${match.team2.is_winner ? "text-emerald-400" : ""} hover:text-emerald-400 transition-colors block sm:inline-block`}>
              {match.team2.name}
            </Link>
            {match.team2.is_winner && <p className="text-emerald-500 text-sm font-medium mt-1">Ganador</p>}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
            {match.date && (
              <div>
                <dt className="text-zinc-500 mb-1">Fecha</dt>
                <dd className="text-zinc-100 font-medium">{match.date}</dd>
              </div>
            )}
            {match.time && (
              <div>
                <dt className="text-zinc-500 mb-1">Hora</dt>
                <dd className="text-zinc-100 font-medium">{match.time}</dd>
              </div>
            )}
            {match.venue && (
              <div>
                <dt className="text-zinc-500 mb-1">Estadio</dt>
                <dd className="text-zinc-100 font-medium">{match.venue}</dd>
              </div>
            )}
            {match.group_name && (
              <div>
                <dt className="text-zinc-500 mb-1">Grupo</dt>
                <dd className="text-zinc-100 font-medium">{match.group_name}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {match.scorers.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <h3 className="font-semibold text-zinc-300 mb-4">Goles</h3>
          <div className="space-y-2">
            {match.scorers.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-right text-zinc-600 tabular-nums">
                  {s.minute}{s.penalty ? " (p)" : ""}
                </span>
                <span className="text-zinc-100 font-medium">{s.player}</span>
                <span className="text-zinc-600">· {s.team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StatsBombTimeline
        year={Number(year)}
        team1={match.team1.name}
        team2={match.team2.name}
        date={match.date}
      />
    </div>
  );
}

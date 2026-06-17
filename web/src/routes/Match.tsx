import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getMatch, getTeams, getVenues, getTv } from "../lib/api";
import type { Match } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import RetryButton from "../components/RetryButton";

interface MatchDetails extends Match {
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
  home_crest?: string;
  away_crest?: string;
}

export default function Match() {
  const { id } = useParams<{ id: string }>();
  const [shouldPoll, setShouldPoll] = useState(true);
  const { timezone } = useTimezone();

  // Static data: fetch once on mount
  const { data: teamsData } = useAsync(() => getTeams(), []);
  const { data: venuesData } = useAsync(() => getVenues(), []);
  const { data: tvData } = useAsync(() => getTv(), []);

  // Dynamic data: poll while match is live
  const { data: match, loading, error } = usePolling(
    (signal) => getMatch(id!, signal),
    30000,
    shouldPoll,
    [id]
  );

  // Update poll condition when match data changes
  useEffect(() => {
    if (match) {
      setShouldPoll(match.status === "live");
    }
  }, [match]);

  // Enrich match with team and venue info
  const enrichedMatch = useMemo(() => {
    if (!match || !teamsData || !venuesData) return null;

    const teamMap = new Map(teamsData.map((t) => [t.id, t]));
    const venueMap = new Map(venuesData.map((v) => [v.id, v]));

    const homeTeam = teamMap.get(match.home_team);
    const awayTeam = teamMap.get(match.away_team);
    const venue = venueMap.get(match.venue);

    return {
      ...match,
      home_team_name: homeTeam?.name,
      away_team_name: awayTeam?.name,
      venue_name: venue?.name,
      home_crest: homeTeam?.crest,
      away_crest: awayTeam?.crest,
    } as MatchDetails;
  }, [match, teamsData, venuesData]);

  const isLoading = !enrichedMatch && (loading || !teamsData || !venuesData);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-5 w-32" />
        <SkeletonCard className="p-4 sm:p-8">
          <div className="text-center mb-6">
            <Skeleton className="h-6 w-24 mx-auto rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-col sm:flex-row">
            <div className="w-full sm:flex-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-28 ml-auto" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
                <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-full" />
              </div>
            </div>
            <div className="text-center px-4 sm:px-8">
              <Skeleton className="h-10 w-20 sm:h-14 sm:w-28" />
            </div>
            <div className="w-full sm:flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-full" />
                <div className="space-y-2 text-left">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Error al cargar</h1>
        <p className="text-zinc-500">No se pudo cargar la información del partido.</p>
        <RetryButton onRetry={() => window.location.reload()} message={error.message} />
        <div>
          <Link
            to="/fixtures"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
          >
            Volver al fixture
          </Link>
        </div>
      </div>
    );
  }

  if (!enrichedMatch) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-300">
          Partido no encontrado
        </h2>
        <Link
          to="/fixtures"
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
        >
          Volver al fixture
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/fixtures"
          className="text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al fixture
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-8">
        <div className="text-center mb-6">
          {enrichedMatch.group ? (
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              Grupo {enrichedMatch.group}
            </span>
          ) : (
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              {enrichedMatch.round}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-col sm:flex-row">
          <div className="w-full sm:flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
              <div>
                <Link
                  to={`/team/${encodeURIComponent(enrichedMatch.home_team_name!)}`}
                  className="text-xl sm:text-2xl font-bold hover:text-emerald-400 transition-colors"
                >
                  {enrichedMatch.home_team_name}
                </Link>
                {enrichedMatch.status !== "scheduled" && (
                  <p className="text-zinc-400">Local</p>
                )}
              </div>
              {enrichedMatch.home_crest && (
                <img
                  src={enrichedMatch.home_crest}
                  alt={enrichedMatch.home_team_name}
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                />
              )}
            </div>
          </div>

          <div className="text-center px-4 sm:px-8">
            {enrichedMatch.status === "finished" || enrichedMatch.status === "live" ? (
              <div className="text-3xl sm:text-5xl font-bold tabular-nums">
                {enrichedMatch.home_score ?? "-"} - {enrichedMatch.away_score ?? "-"}
              </div>
            ) : (
              <div className="text-xl sm:text-2xl text-zinc-500">VS</div>
            )}
            {enrichedMatch.status === "live" && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full animate-pulse">
                EN VIVO
              </span>
            )}
            <div className="mt-3">
              <Link
                to={`/head-to-head/${encodeURIComponent(enrichedMatch.home_team_name!)}/${encodeURIComponent(enrichedMatch.away_team_name!)}`}
                className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2"
              >
                Historial
              </Link>
            </div>
          </div>

          <div className="w-full sm:flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
              {enrichedMatch.away_crest && (
                <img
                  src={enrichedMatch.away_crest}
                  alt={enrichedMatch.away_team_name}
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                />
              )}
              <div>
                <Link
                  to={`/team/${encodeURIComponent(enrichedMatch.away_team_name!)}`}
                  className="text-xl sm:text-2xl font-bold hover:text-emerald-400 transition-colors"
                >
                  {enrichedMatch.away_team_name}
                </Link>
                {enrichedMatch.status !== "scheduled" && (
                  <p className="text-zinc-400">Visitante</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
            <div>
              <dt className="text-zinc-500 mb-1">Fecha</dt>
              <dd className="text-zinc-100 font-medium">
                {formatMatchTime(enrichedMatch.date, enrichedMatch.time, timezone)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 mb-1">Estado</dt>
              <dd className="text-zinc-100 font-medium capitalize">
                {enrichedMatch.status === "scheduled"
                  ? "Programado"
                  : enrichedMatch.status === "live"
                  ? "En vivo"
                  : enrichedMatch.status === "finished"
                  ? "Finalizado"
                  : enrichedMatch.status}
              </dd>
            </div>
            {enrichedMatch.venue_name && (
              <div>
                <dt className="text-zinc-500 mb-1">Estadio</dt>
                <dd className="text-zinc-100 font-medium">{enrichedMatch.venue_name}</dd>
              </div>
            )}
          </dl>
        </div>

        {tvData && tvData.length > 0 && (
          <div className="border-t border-zinc-800 pt-4 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 mr-1">TV:</span>
              {tvData.map((ch) => (
                <span
                  key={ch.id}
                  className="inline-block px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-md"
                >
                  {ch.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
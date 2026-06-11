import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatch, getTeams, getVenues } from "../lib/api";
import type { Match } from "../lib/types";

interface MatchDetails extends Match {
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
  home_crest?: string;
  away_crest?: string;
}

export default function Match() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatch() {
      if (!id) return;

      try {
        const [matchData, teamsData, venuesData] = await Promise.all([
          getMatch(id),
          getTeams(),
          getVenues(),
        ]);

        if (!matchData) {
          setMatch(null);
          return;
        }

        const teamMap = new Map(teamsData.map((t) => [t.id, t]));
        const venueMap = new Map(venuesData.map((v) => [v.id, v]));

        const homeTeam = teamMap.get(matchData.home_team);
        const awayTeam = teamMap.get(matchData.away_team);
        const venue = venueMap.get(matchData.venue);

        setMatch({
          ...matchData,
          home_team_name: homeTeam?.name,
          away_team_name: awayTeam?.name,
          venue_name: venue?.name,
          home_crest: homeTeam?.crest,
          away_crest: awayTeam?.crest,
        });
      } catch (error) {
        console.error("Error loading match:", error);
        setMatch(null);
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-zinc-400 py-12">Cargando partido...</div>
    );
  }

  if (!match) {
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
          {match.group ? (
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              Grupo {match.group}
            </span>
          ) : (
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              {match.round}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-col sm:flex-row">
          <div className="w-full sm:flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">{match.home_team_name}</h3>
                {match.status !== "scheduled" && (
                  <p className="text-zinc-400">Local</p>
                )}
              </div>
              {match.home_crest && (
                <img
                  src={match.home_crest}
                  alt={match.home_team_name}
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                />
              )}
            </div>
          </div>

          <div className="text-center px-4 sm:px-8">
            {match.status === "finished" || match.status === "live" ? (
              <div className="text-3xl sm:text-5xl font-bold tabular-nums">
                {match.home_score ?? "-"} - {match.away_score ?? "-"}
              </div>
            ) : (
              <div className="text-xl sm:text-2xl text-zinc-500">VS</div>
            )}
            {match.status === "live" && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full animate-pulse">
                EN VIVO
              </span>
            )}
          </div>

          <div className="w-full sm:flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
              {match.away_crest && (
                <img
                  src={match.away_crest}
                  alt={match.away_team_name}
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                />
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">{match.away_team_name}</h3>
                {match.status !== "scheduled" && (
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
                {match.date} {match.time}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 mb-1">Estado</dt>
              <dd className="text-zinc-100 font-medium capitalize">
                {match.status === "scheduled"
                  ? "Programado"
                  : match.status === "live"
                  ? "En vivo"
                  : match.status === "finished"
                  ? "Finalizado"
                  : match.status}
              </dd>
            </div>
            {match.venue_name && (
              <div>
                <dt className="text-zinc-500 mb-1">Estadio</dt>
                <dd className="text-zinc-100 font-medium">{match.venue_name}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
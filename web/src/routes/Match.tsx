import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getMatch, getTeams, getVenues, fetchMatchEnriched } from "../lib/api";
import type { Match } from "../lib/types";
import { PHASE_LABELS } from "../lib/constants";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import { trackPageView } from "../lib/analytics";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import RetryButton from "../components/RetryButton";
import HeadToHeadCard from "../components/HeadToHeadCard";
import { isValidMatchId } from "../lib/validation";
import { useNavigateBack } from "../lib/navigation";

interface MatchDetails extends Match {
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
  home_crest?: string;
  away_crest?: string;
}

function Countdown({ datetimeUtc, status }: { datetimeUtc?: string; status: string }) {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!datetimeUtc) return;
    if (status === "finished") {
      setDisplay("Finalizado");
      return;
    }
    if (status === "live") {
      setDisplay("En Vivo");
      return;
    }

    const update = () => {
      const diff = new Date(datetimeUtc).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay("En Vivo");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${d}d ${h}h ${m}m ${s}s`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [datetimeUtc, status]);

  if (!display) return null;

  const isCountdown =
    status === "scheduled" && display !== "En Vivo" && display !== "Finalizado";

  return (
    <span
      className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full tabular-nums ${
        isCountdown
          ? "bg-amber-500/20 text-amber-400"
          : display === "En Vivo"
            ? "bg-red-500/20 text-red-400 animate-pulse"
            : "bg-zinc-700/50 text-zinc-400"
      }`}
    >
      {display}
    </span>
  );
}

export default function Match() {
  const { id } = useParams<{ id: string }>();
  const goBack = useNavigateBack("/fixtures");
  const [shouldPoll, setShouldPoll] = useState(true);
  const { timezone } = useTimezone();

  // Static data: fetch once on mount
  const { data: teamsData } = useAsync(() => getTeams(), []);
  const { data: venuesData } = useAsync(() => getVenues(), []);

  // Enriched data: one-shot H2H fetch (non-blocking, no loading state)
  const { data: enrichedData } = useAsync(
    () => (id ? fetchMatchEnriched(id) : Promise.resolve(null)),
    [id],
  );

  // Dynamic data: poll while match is live
  const { data: match, loading, error } = usePolling(
    (signal) => getMatch(id!, signal),
    60000,
    shouldPoll,
    [id]
  );

  // Update poll condition when match data changes
  useEffect(() => {
    if (match) {
      setShouldPoll(match.status === "live");
    }
  }, [match]);

  // Analytics tracking
  useEffect(() => {
    if (id) trackPageView(`/match/${id}`, id);
  }, [id]);

  // Toast state for clipboard fallback
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (toast) {
      toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(toastTimeoutRef.current);
    }
  }, [toast]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = enrichedMatch
      ? `${enrichedMatch.home_team_name} vs ${enrichedMatch.away_team_name} - Copa Mundial 2026`
      : document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or error — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setToast("Enlace copiado");
    } catch {
      // Clipboard not available
    }
  };

  const handleCalendar = () => {
    if (!enrichedMatch) return;

    const matchDate = enrichedMatch.datetime_utc
      ? new Date(enrichedMatch.datetime_utc)
      : enrichedMatch.date
        ? new Date(enrichedMatch.date)
        : null;

    if (!matchDate) return;

    const endDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // 2h duration
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Copa2026//Match//ES",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(matchDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:${enrichedMatch.home_team_name} vs ${enrichedMatch.away_team_name} - Copa Mundial 2026`,
    ];

    if (enrichedMatch.venue_name) {
      lines.push(`LOCATION:${enrichedMatch.venue_name}`);
    }

    lines.push("END:VEVENT");
    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${enrichedMatch.home_team_name}-vs-${enrichedMatch.away_team_name}.ics`.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Enrich match with team and venue info
  const enrichedMatch = useMemo(() => {
    if (!match || !teamsData || !venuesData) return null;

    const teamMap = new Map(teamsData.map((t) => [t.id, t]));
    const venueMap = new Map(venuesData.map((v) => [v.id, v]));

    const homeTeam = match.home_team ? teamMap.get(match.home_team) : null;
    const awayTeam = match.away_team ? teamMap.get(match.away_team) : null;
    const venue = match.venue ? venueMap.get(match.venue) : null;

    return {
      ...match,
      home_team_name: homeTeam?.name || "A definir",
      away_team_name: awayTeam?.name || "A definir",
      venue_name: venue?.name,
      home_crest: homeTeam?.crest,
      away_crest: awayTeam?.crest,
    } as MatchDetails;
  }, [match, teamsData, venuesData]);

  const isLoading = !enrichedMatch && (loading || !teamsData || !venuesData);

  // Invalid ID — show immediately without fetching
  if (id && !isValidMatchId(id)) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Error</h1>
        <h2 className="text-2xl font-semibold text-zinc-300">
          ID de partido inválido
        </h2>
        <p className="text-zinc-500">
          El identificador del partido no es válido.
        </p>
        <button
          onClick={goBack}
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

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
    const is404 = (error as unknown as Record<string, unknown>).status === 404;

    if (is404) {
      return (
        <div className="text-center py-20 space-y-6">
          <h1 className="text-4xl font-bold text-zinc-700">404</h1>
          <h2 className="text-2xl font-semibold text-zinc-300">
            Partido no encontrado
          </h2>
          <p className="text-zinc-500">
            No encontramos el partido que estás buscando.
          </p>
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
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Error al cargar</h1>
        <p className="text-zinc-500">No se pudo cargar la información del partido.</p>
        <RetryButton onRetry={() => window.location.reload()} message={error.message} />
        <div>
          <button
            onClick={goBack}
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Volver
          </button>
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
        <p className="text-zinc-500">
          No encontramos el partido que estás buscando.
        </p>
        <button
          onClick={goBack}
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  const phaseLabel = enrichedMatch.phase
    ? PHASE_LABELS[enrichedMatch.phase]
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
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
          Volver
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2"
          >
            Compartir
          </button>
          <button
            onClick={handleCalendar}
            className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2"
          >
            Agregar a calendario
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-8">
        <div className="text-center mb-6">
          {phaseLabel ? (
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              {phaseLabel}
            </span>
          ) : enrichedMatch.group ? (
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              Grupo {enrichedMatch.group}
            </span>
          ) : enrichedMatch.round ? (
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              {enrichedMatch.round}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 flex-col sm:flex-row">
          <div className="w-full sm:flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
              <div>
                {enrichedMatch.home_team ? (
                  <Link
                    to={`/team/${encodeURIComponent(enrichedMatch.home_team_name!)}`}
                    className="text-xl sm:text-2xl font-bold hover:text-emerald-400 transition-colors"
                  >
                    {enrichedMatch.home_team_name}
                  </Link>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-zinc-500">
                    A definir
                  </span>
                )}
                {enrichedMatch.status !== "scheduled" && enrichedMatch.home_team && (
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
            <Countdown datetimeUtc={enrichedMatch.datetime_utc} status={enrichedMatch.status} />
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
                {enrichedMatch.away_team ? (
                  <Link
                    to={`/team/${encodeURIComponent(enrichedMatch.away_team_name!)}`}
                    className="text-xl sm:text-2xl font-bold hover:text-emerald-400 transition-colors"
                  >
                    {enrichedMatch.away_team_name}
                  </Link>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-zinc-500">
                    A definir
                  </span>
                )}
                {enrichedMatch.status !== "scheduled" && enrichedMatch.away_team && (
                  <p className="text-zinc-400">Visitante</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Head-to-head card - non-blocking fetch, appears once data arrives */}
        {enrichedData?.head_to_head && enrichedMatch.home_team_name && enrichedMatch.away_team_name ? (
          <HeadToHeadCard
            summary={enrichedData.head_to_head}
            homeTeam={enrichedMatch.home_team_name}
            awayTeam={enrichedMatch.away_team_name}
          />
        ) : null}

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
                <dd className="text-zinc-100 font-medium">
                  <Link
                    to={`/venues/${enrichedMatch.venue}`}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {enrichedMatch.venue_name}
                    {enrichedMatch.venue_city && `, ${enrichedMatch.venue_city}`}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

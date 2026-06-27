import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { usePolling } from "../lib/usePolling";
import { getUpcomingMatches, getFeaturedVenues } from "../lib/api";
import type { Match, Venue } from "../lib/types";
import { trackPageView } from "../lib/analytics";
import { useTimezone } from "../lib/useTimezone";
import { formatMatchTime } from "../lib/formatTime";
import LiveWidget from "../components/LiveWidget";
import NavGrid from "../components/NavGrid";
import type { NavGridItem } from "../components/NavGrid";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";

function UpcomingMatchesSection({
  matches,
  loading,
  error,
  onRetry,
}: {
  matches: Match[] | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const { timezone } = useTimezone();

  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </SkeletonCard>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Próximos partidos</h2>
        <ErrorState message={error.message} onRetry={onRetry} />
      </section>
    );
  }

  if (!matches || matches.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Próximos partidos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            to={`/match/${match.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-right text-zinc-100 font-medium truncate">
                {match.home_team_name || match.home_team}
              </div>
              <div className="text-center shrink-0">
                <span className="text-sm text-zinc-500">VS</span>
              </div>
              <div className="flex-1 text-left text-zinc-100 font-medium truncate">
                {match.away_team_name || match.away_team}
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-500 text-center">
              {formatMatchTime(match.date, match.time, timezone)} —{" "}
              {match.venue_name || match.venue || ""}
            </div>
          </Link>
        ))}
      </div>
      <Link
        to="/fixtures"
        className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Ver todo el fixture →
      </Link>
    </section>
  );
}

function FeaturedVenuesSection({
  venues,
  loading,
  error,
  onRetry,
}: {
  venues: Venue[] | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20 mt-2" />
            </SkeletonCard>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Sedes destacadas</h2>
        <ErrorState message={error.message} onRetry={onRetry} />
      </section>
    );
  }

  if (!venues || venues.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Sedes destacadas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            to={`/venues/${venue.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
          >
            <h3 className="font-semibold">{venue.name}</h3>
            <p className="text-sm text-zinc-400">
              {venue.city}, {venue.country}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {venue.capacity.toLocaleString()} espectadores
            </p>
          </Link>
        ))}
      </div>
      <Link
        to="/venues"
        className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Ver todas las sedes →
      </Link>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    trackPageView("/");
  }, []);

  const [shouldPollMatches, setShouldPollMatches] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const {
    data: matches,
    loading: matchesLoading,
    error: matchesError,
  } = usePolling(
    () => getUpcomingMatches(3),
    30000,
    shouldPollMatches,
    [retryKey]
  );

  const refetchMatches = () => {
    setShouldPollMatches(true);
    setRetryKey((k) => k + 1);
  };

  const {
    data: venues,
    loading: venuesLoading,
    error: venuesError,
    refetch: refetchVenues,
  } = useAsync(() => getFeaturedVenues(3), []);

  const hasAnyPreviewData =
    matches || venues ||
    matchesLoading || venuesLoading;

  const navItems: NavGridItem[] = [
    { label: "Grupos", to: "/groups", description: "Tabla de posiciones y fixtures de cada grupo" },
    { label: "Fixture", to: "/fixtures", description: "Todos los partidos del torneo" },
    { label: "Eliminatorias", to: "/bracket", description: "Cuadro desde octavos hasta la final" },
    { label: "Sedes", to: "/venues", description: "Los 16 estadios en 3 países" },
    { label: "Historial", to: "/historical", description: "Todos los mundiales desde 1930" },
  ];

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">
          Mundial de la FIFA 2026
        </h2>
        <p className="text-zinc-400 text-lg">
          México • Estados Unidos • Canadá
        </p>
        <p className="text-zinc-500">
          11 de junio - 19 de julio, 2026
        </p>
      </section>

      <NavGrid items={navItems} />

      <LiveWidget />

      {hasAnyPreviewData && (
        <UpcomingMatchesSection
          matches={matches}
          loading={matchesLoading}
          error={matchesError}
          onRetry={refetchMatches}
        />
      )}

      {hasAnyPreviewData && (
        <FeaturedVenuesSection
          venues={venues}
          loading={venuesLoading}
          error={venuesError}
          onRetry={refetchVenues}
        />
      )}
    </div>
  );
}

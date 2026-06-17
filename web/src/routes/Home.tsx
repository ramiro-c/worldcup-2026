import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getUpcomingMatches, getFeaturedVenues, getTv } from "../lib/api";
import type { Match, Venue, TvChannel } from "../lib/types";
import { trackPageView } from "../lib/analytics";
import { useTimezone } from "../lib/useTimezone";
import { formatMatchTime } from "../lib/formatTime";
import LiveWidget from "../components/LiveWidget";
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
    </section>
  );
}

function TvChannelsSection({
  channels,
  loading,
  error,
  onRetry,
}: {
  channels: TvChannel[] | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <SkeletonCard className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </SkeletonCard>
        <SkeletonCard className="p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </SkeletonCard>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Canales de TV</h2>
        <ErrorState message={error.message} onRetry={onRetry} />
      </section>
    );
  }

  if (!channels || channels.length === 0) return null;

  const byCountry = channels.reduce((acc, ch) => {
    if (!acc[ch.country]) acc[ch.country] = [];
    acc[ch.country].push(ch.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Canales de TV</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(byCountry).map(([country, names]) => (
          <div
            key={country}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <h3 className="font-semibold text-sm text-zinc-400 mb-2">
              {country}
            </h3>
            <ul className="space-y-1">
              {names.map((name) => (
                <li key={name} className="text-zinc-300 text-sm">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    trackPageView("/");
  }, []);

  const {
    data: matches,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useAsync(() => getUpcomingMatches(5), []);

  const {
    data: venues,
    loading: venuesLoading,
    error: venuesError,
    refetch: refetchVenues,
  } = useAsync(() => getFeaturedVenues(4), []);

  const {
    data: channels,
    loading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useAsync(() => getTv(), []);

  const hasAnyData =
    matches || venues || channels ||
    matchesLoading || venuesLoading || channelsLoading;

  return (
    <div className="space-y-8">
      <LiveWidget />

      <section className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">
          Copa Mundial de la FIFA 2026
        </h2>
        <p className="text-zinc-400 text-lg">
          México • Estados Unidos • Canadá
        </p>
        <p className="text-zinc-500">
          11 de junio - 19 de julio, 2026
        </p>
      </section>

      {hasAnyData && (
        <UpcomingMatchesSection
          matches={matches}
          loading={matchesLoading}
          error={matchesError}
          onRetry={refetchMatches}
        />
      )}

      {hasAnyData && (
        <FeaturedVenuesSection
          venues={venues}
          loading={venuesLoading}
          error={venuesError}
          onRetry={refetchVenues}
        />
      )}

      {hasAnyData && (
        <TvChannelsSection
          channels={channels}
          loading={channelsLoading}
          error={channelsError}
          onRetry={refetchChannels}
        />
      )}

      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/groups"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Grupos</h3>
          <p className="text-sm text-zinc-400">
            Tabla de posiciones y fixtures de cada grupo
          </p>
        </Link>

        <Link
          to="/fixtures"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Fixture</h3>
          <p className="text-sm text-zinc-400">
            Todos los partidos del torneo
          </p>
        </Link>

        <Link
          to="/bracket"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Eliminatorias</h3>
          <p className="text-sm text-zinc-400">
            Cuadro desde octavos hasta la final
          </p>
        </Link>

        <Link
          to="/venues"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Sedes</h3>
          <p className="text-sm text-zinc-400">
            Los 16 estadios en 3 países
          </p>
        </Link>

        <Link
          to="/historical"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">Historial</h3>
          <p className="text-sm text-zinc-400">
            Todos los mundiales desde 1930
          </p>
        </Link>
      </nav>
    </div>
  );
}

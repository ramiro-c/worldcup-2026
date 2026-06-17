import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getVenues, getMatches } from "../lib/api";
import type { Match, Venue } from "../lib/types";
import { formatMatchTime } from "../lib/formatTime";
import { useTimezone } from "../lib/useTimezone";
import { trackPageView } from "../lib/analytics";
import { Skeleton } from "../components/Skeleton";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Fix Leaflet default marker icon for bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function formatCapacity(capacity: number): string {
  return new Intl.NumberFormat("es-ES").format(capacity);
}

export default function VenueDetail() {
  const { venueId } = useParams<{ venueId: string }>();
  const { timezone } = useTimezone();

  useEffect(() => { trackPageView(`/venues/${venueId}`); }, [venueId]);

  const {
    data: venues,
    loading: venuesLoading,
    error: venuesError,
  } = useAsync(() => getVenues(), []);
  const { data: matches, loading: matchesLoading } = useAsync(
    () => getMatches(),
    [],
  );

  const venue = useMemo(() => {
    if (!venues || !venueId) return null;
    return venues.find((v: Venue) => v.id === venueId) ?? null;
  }, [venues, venueId]);

  const venueMatches = useMemo(() => {
    if (!matches || !venueId) return [];
    return matches.filter((m: Match) => m.venue === venueId);
  }, [matches, venueId]);

  if (venuesLoading || matchesLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (venuesError || (!venue && venues)) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Estadio no encontrado</h1>
        <p className="text-zinc-500">
          El estadio solicitado no existe o no está disponible.
        </p>
        <Link
          to="/venues"
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
        >
          Volver a estadios
        </Link>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Cargando...</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/venues"
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
          Volver a estadios
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold">{venue.name}</h2>
        <p className="text-zinc-400">
          {venue.city}, {venue.country}
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-zinc-800 h-[350px] sm:h-[450px]">
        <MapContainer
          center={[venue.latitude, venue.longitude]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[venue.latitude, venue.longitude]}>
            <Popup>
              {venue.name}
              <br />
              {venue.city}, {venue.country}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <dt className="text-zinc-500 mb-1">Capacidad</dt>
          <dd className="text-zinc-100 font-medium text-lg">
            {formatCapacity(venue.capacity)} espectadores
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <dt className="text-zinc-500 mb-1">Región</dt>
          <dd className="text-zinc-100 font-medium text-lg">{venue.region}</dd>
        </div>
      </dl>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Partidos</h3>
        {venueMatches.length > 0 ? (
          <div className="space-y-2">
            {venueMatches.map((m: Match) => (
              <Link
                key={m.id}
                to={`/match/${m.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-right text-zinc-100 font-medium">
                    {m.home_team_name || m.home_team}
                  </div>
                  <div className="text-center min-w-[60px]">
                    {m.status === "finished" || m.status === "live" ? (
                      <span className="text-lg font-bold tabular-nums text-zinc-100">
                        {m.home_score ?? "-"} - {m.away_score ?? "-"}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-500">VS</span>
                    )}
                  </div>
                  <div className="flex-1 text-left text-zinc-100 font-medium">
                    {m.away_team_name || m.away_team}
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  {formatMatchTime(m.date, m.time, timezone)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 italic">
            No hay partidos programados en este estadio
          </p>
        )}
      </section>
    </div>
  );
}

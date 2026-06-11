import { useState } from "react";
import { useAsync } from "../lib/useAsync";
import { getVenues } from "../lib/api";
import type { Venue } from "../lib/types";
import { Skeleton, SkeletonCard } from "../components/Skeleton";

export default function Venues() {
  const { data: venues, loading, error, refetch } = useAsync(getVenues, []);

  const [regionFilter, setRegionFilter] = useState<string>("all");

  const filteredVenues = venues?.filter((venue) => {
    if (regionFilter === "all") return true;
    return venue.region === regionFilter;
  }) ?? [];

  const venuesByCountry = filteredVenues.reduce((acc, venue) => {
    if (!acc[venue.country]) acc[venue.country] = [];
    acc[venue.country].push(venue);
    return acc;
  }, {} as Record<string, Venue[]>);

  const regionLabels: Record<string, string> = {
    all: "Todas",
    Western: "Oeste",
    Central: "Centro",
    Eastern: "Este",
  };
  const regions = Object.keys(regionLabels);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((country) => (
            <div key={country} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((venue) => (
                  <SkeletonCard key={venue} className="p-4 space-y-3">
                    <div>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32 mt-1" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-zinc-800">
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </SkeletonCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-400">Error: {error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-medium rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <h2 className="text-2xl font-bold">Sedes</h2>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                regionFilter === region
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {regionLabels[region] || region}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(venuesByCountry).map(([country, countryVenues]) => (
          <div key={country} className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-300">{country}</h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countryVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 hover:border-emerald-500/50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold">{venue.name}</h4>
                    <p className="text-sm text-zinc-400">
                      {venue.city}, {venue.country}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-zinc-400">
                    <div className="flex justify-between">
                      <span>Capacidad:</span>
                      <span className="text-zinc-300">
                        {venue.capacity.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Región:</span>
                      <span className="text-zinc-300">{regionLabels[venue.region] || venue.region}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800">
                    <a
                      href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Ver en mapa
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
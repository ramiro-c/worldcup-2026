import { useState, useEffect } from "react";
import { getVenues } from "../lib/api";
import type { Venue } from "../lib/types";

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVenues() {
      try {
        const data = await getVenues();
        setVenues(data);
      } catch (error) {
        console.error("Error loading venues:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVenues();
  }, []);

  const filteredVenues = venues.filter((venue) => {
    if (regionFilter === "all") return true;
    return venue.region === regionFilter;
  });

  const venuesByCountry = filteredVenues.reduce((acc, venue) => {
    if (!acc[venue.country]) acc[venue.country] = [];
    acc[venue.country].push(venue);
    return acc;
  }, {} as Record<string, Venue[]>);

  const regions = ["all", "Western", "Central", "Eastern"];

  if (loading) {
    return <div className="text-center text-zinc-400 py-12">Cargando sedes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Sedes</h2>
        <div className="flex gap-2">
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
              {region === "all" ? "Todas" : region}
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
                      <span className="text-zinc-300">{venue.region}</span>
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
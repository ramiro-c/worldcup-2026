import { useEffect, useState } from "react";
import { useAsync } from "../lib/useAsync";
import { getTv } from "../lib/api";
import { trackPageView } from "../lib/analytics";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";

export default function Tv() {
  useEffect(() => { trackPageView("/tv"); }, []);

  const { data: channels, loading, error, refetch } = useAsync(getTv, []);

  const [countryFilter, setCountryFilter] = useState<string>("all");

  const countries = channels
    ? Array.from(new Set(channels.map((ch) => ch.country))).sort()
    : [];

  const filteredChannels = channels?.filter((ch) => {
    if (countryFilter === "all") return true;
    return ch.country === countryFilter;
  }) ?? [];

  const byCountry = filteredChannels.reduce((acc, ch) => {
    if (!acc[ch.country]) acc[ch.country] = [];
    acc[ch.country].push(ch.name);
    return acc;
  }, {} as Record<string, string[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((country) => (
            <SkeletonCard key={country} className="p-4 space-y-2">
              <Skeleton className="h-5 w-32" />
              {[1, 2, 3].map((ch) => (
                <Skeleton key={ch} className="h-4 w-full" />
              ))}
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Canales de TV</h2>
        <p className="text-zinc-500">No hay canales disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <h2 className="text-2xl font-bold">Canales de TV</h2>
        <div className="flex flex-wrap gap-2">
          <button
            key="all"
            onClick={() => setCountryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              countryFilter === "all"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Todas
          </button>
          {countries.map((country) => (
            <button
              key={country}
              onClick={() => setCountryFilter(country)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                countryFilter === country
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {country}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(byCountry).length === 0 ? (
        <p className="text-zinc-500 text-center py-8">
          Sin canales para este país
        </p>
      ) : (
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
      )}
    </div>
  );
}

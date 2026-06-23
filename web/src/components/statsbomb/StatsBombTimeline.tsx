import { useEffect, useState } from "react";
import {
  getHistoricalCompetitions,
  getHistoricalMatches,
  getHistoricalMatchEvents,
  getHistoricalMatchLineups,
} from "../../lib/api";
import {
  matchByTeamsAndDate,
  parseEvents,
  parseLineups,
  isWorldCupCompetition,
} from "../../lib/statsbomb";
import type {
  StatsBombTimelineEvent,
  StatsBombShot,
  StatsBombLineup,
} from "../../lib/types";
import { EventTimeline } from "./EventTimeline";
import { Lineups } from "./Lineups";
import { ShotMap } from "./ShotMap";
import { Skeleton } from "../Skeleton";

interface StatsBombTimelineProps {
  year: number;
  team1: string;
  team2: string;
  date: string | null;
}

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "no-coverage" }
  | { status: "error"; message: string }
  | {
      status: "loaded";
      timelineEvents: StatsBombTimelineEvent[];
      shots: StatsBombShot[];
      lineups: StatsBombLineup[];
    };

function StatsBombAttribution() {
  return (
    <p className="text-xs text-zinc-500 mt-3">
      <a
        href="https://statsbomb.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-300"
      >
        StatsBomb
      </a>{" "}
      · Datos de eventos de partidos
    </p>
  );
}

export function StatsBombTimeline({ year, team1, team2, date }: StatsBombTimelineProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function discover() {
      setLoadState({ status: "loading" });

      try {
        // 1. Fetch competitions
        const competitions = await getHistoricalCompetitions();

        // 2. Find World Cup competition + season matching the year
        const wcComp = competitions.find(
          (c) => isWorldCupCompetition(c) && c.season_name === String(year),
        );

        if (!wcComp) {
          if (!cancelled) setLoadState({ status: "no-coverage" });
          return;
        }

        // 3. Fetch matches for that competition + season
        const matches = await getHistoricalMatches(
          wcComp.competition_id,
          wcComp.season_id,
        );

        // 4. Match by team names + date
        const matchedMatch = matchByTeamsAndDate(
          { team1: { name: team1 }, team2: { name: team2 }, date },
          matches,
        );

        if (!matchedMatch) {
          if (!cancelled) setLoadState({ status: "no-coverage" });
          return;
        }

        const matchId = Number(matchedMatch.match_id);
        if (!matchId || isNaN(matchId)) {
          if (!cancelled) setLoadState({ status: "no-coverage" });
          return;
        }

        // 5. Fetch events and lineups in parallel
        const [rawEvents, rawLineups] = await Promise.all([
          getHistoricalMatchEvents(matchId).catch(() => [] as Record<string, unknown>[]),
          getHistoricalMatchLineups(matchId).catch(() => [] as Record<string, unknown>[]),
        ]);

        // 6. Parse data
        const { timelineEvents, shots } = parseEvents(rawEvents);
        const lineups = parseLineups(rawLineups, timelineEvents);

        if (!cancelled) {
          setLoadState({ status: "loaded", timelineEvents, shots, lineups });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
    }

    discover();
    return () => { cancelled = true; };
  }, [year, team1, team2, date]);

  // ── Loading skeleton ──
  if (loadState.status === "idle" || loadState.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ── No coverage ──
  if (loadState.status === "no-coverage") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-500">
          Cobertura de StatsBomb no disponible para este partido
        </p>
      </div>
    );
  }

  // ── Error ──
  if (loadState.status === "error") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center space-y-3">
        <p className="text-sm text-zinc-500">
          Error al cargar datos de StatsBomb: {loadState.message}
        </p>
        <button
          onClick={() => setLoadState({ status: "idle" })}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Loaded ──
  const { timelineEvents, shots, lineups } = loadState;

  return (
    <div className="space-y-6">
      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-6">
          Datos StatsBomb
        </h2>

        <div className="space-y-6">
          <Lineups lineups={lineups} />
          <EventTimeline events={timelineEvents} />
          <ShotMap shots={shots} />
          <StatsBombAttribution />
        </div>
      </div>
    </div>
  );
}

export default StatsBombTimeline;

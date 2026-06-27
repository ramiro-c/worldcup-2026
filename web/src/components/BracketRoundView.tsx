import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { BracketRound } from "../lib/types";

interface BracketRoundViewProps {
  rounds: BracketRound[];
}

function cardState(match: { home_score: number | null; away_score: number | null; home_team_name: string | null; away_team_name: string | null }): "finished" | "scheduled" | "tbd" {
  if (match.home_team_name === null && match.away_team_name === null) return "tbd";
  if (match.home_score !== null && match.away_score !== null) return "finished";
  return "scheduled";
}

function gridCols(matchCount: number): string {
  if (matchCount <= 1) return "grid-cols-1 max-w-md mx-auto";
  if (matchCount <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2";
}

export default function BracketRoundView({ rounds }: BracketRoundViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve active round: ?round param → fallback to earliest with data
  const activeRound = useMemo(() => {
    if (rounds.length === 0) return null;
    const param = searchParams.get("round");
    if (param) {
      const found = rounds.find((r) => r.label === param);
      if (found) return found;
    }
    return rounds[0];
  }, [rounds, searchParams]);

  if (!activeRound) return null;

  const matches = activeRound.matches;

  function selectRound(label: string) {
    setSearchParams({ round: label }, { replace: true });
  }

  return (
    <div className="space-y-6">
      {/* ── Round selector tab bar ── */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div
          role="tablist"
          className="flex gap-1 rounded-xl bg-zinc-900 p-1 w-fit"
        >
          {rounds.map((round) => (
            <button
              key={round.name}
              role="tab"
              aria-selected={round.name === activeRound.name}
              onClick={() => selectRound(round.label)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                round.name === activeRound.name
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {round.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Round label ── */}
      <h3 className="text-lg font-semibold text-zinc-300">
        {activeRound.label}
      </h3>

      {/* ── Match grid ── */}
      <div
        role="list"
        className={`grid gap-4 ${gridCols(matches.length)}`}
      >
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

// ── MatchCard ──────────────────────────────────────────────

function MatchCard({ match }: { match: import("../lib/types").BracketMatch }) {
  const state = cardState(match);
  const isFinished = state === "finished";
  const isTbd = state === "tbd";
  const isScheduled = state === "scheduled";

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const homeIsWinner = isFinished && homeScore > awayScore;
  const awayIsWinner = isFinished && awayScore > homeScore;
  const isDraw = isFinished && homeScore === awayScore;

  return (
    <div
      role="listitem"
      data-card-state={state}
      className={`rounded-xl p-3 ${
        isTbd
          ? "border border-dashed border-zinc-700 bg-transparent opacity-60"
          : "border border-solid border-zinc-700 bg-zinc-900/50"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {/* Home team */}
        {match.home_team_name ? (
          <>
            <img
              src={match.home_crest ?? ""}
              alt={`${match.home_team_name} crest`}
              role="img"
              aria-label={`${match.home_team_name} crest`}
              data-eliminated={isFinished && !isDraw && !homeIsWinner ? "true" : undefined}
              className={`w-6 h-6 object-contain ${
                isFinished && !isDraw && !homeIsWinner ? "grayscale opacity-60" : ""
              }`}
            />
            <span
              className={`text-sm tabular-nums ${
                homeIsWinner ? "text-zinc-100 font-bold" : "text-zinc-300"
              }`}
            >
              {match.home_team?.toUpperCase() ?? "TBD"}
            </span>
          </>
        ) : (
          <>
            <span className="w-6 h-6" />
            <span className="text-sm text-zinc-500 italic">TBD</span>
          </>
        )}

        {/* Score */}
        <span className="text-sm font-bold tabular-nums text-zinc-100 min-w-[2ch] text-center">
          {match.home_score !== null ? match.home_score : "—"}
        </span>
        <span className="text-zinc-600 text-sm">—</span>
        <span className="text-sm font-bold tabular-nums text-zinc-100 min-w-[2ch] text-center">
          {match.away_score !== null ? match.away_score : "—"}
        </span>

        {/* Away team */}
        {match.away_team_name ? (
          <>
            <span
              className={`text-sm tabular-nums ${
                awayIsWinner ? "text-zinc-100 font-bold" : "text-zinc-300"
              }`}
            >
              {match.away_team?.toUpperCase() ?? "TBD"}
            </span>
            <img
              src={match.away_crest ?? ""}
              alt={`${match.away_team_name} crest`}
              role="img"
              aria-label={`${match.away_team_name} crest`}
              data-eliminated={isFinished && !isDraw && !awayIsWinner ? "true" : undefined}
              className={`w-6 h-6 object-contain ${
                isFinished && !isDraw && !awayIsWinner ? "grayscale opacity-60" : ""
              }`}
            />
          </>
        ) : (
          <>
            <span className="text-sm text-zinc-500 italic">TBD</span>
            <span className="w-6 h-6" />
          </>
        )}
      </div>

      {/* Date/timestamp for scheduled matches */}
      {isScheduled && match.date && (
        <div className="text-center mt-2 text-xs text-zinc-500">
          {match.date}
        </div>
      )}
    </div>
  );
}

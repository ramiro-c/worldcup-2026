import { Link } from "react-router-dom";
import type { HeadToHeadSummary } from "../lib/types";

interface HeadToHeadCardProps {
  summary: HeadToHeadSummary;
  homeTeam: string;
  awayTeam: string;
}

export default function HeadToHeadCard({ summary, homeTeam, awayTeam }: HeadToHeadCardProps) {
  if (summary.total_matches === 0) {
    return (
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Historial
        </h3>
        <p className="text-zinc-500 text-sm italic">
          Sin enfrentamientos previos
        </p>
        <Link
          to={`/head-to-head/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`}
          className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2 mt-2 inline-block"
        >
          Ver historial completo
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-800 pt-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Historial
      </h3>

      {/* Summary stats */}
      <div className="flex items-center justify-center gap-6 mb-5 text-center">
        <div>
          <div className="text-xl font-bold text-emerald-400">{summary.team1_wins}</div>
          <div className="text-xs text-zinc-500">{homeTeam}</div>
        </div>
        <div>
          <div className="text-xl font-bold text-zinc-300">{summary.draws}</div>
          <div className="text-xs text-zinc-500">Empates</div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-400">{summary.team2_wins}</div>
          <div className="text-xs text-zinc-500">{awayTeam}</div>
        </div>
      </div>

      {/* Goals stats */}
      <div className="flex items-center justify-center gap-4 mb-5 text-xs text-zinc-500">
        <span>
          Goles: <strong className="text-zinc-300">{summary.team1_goals}</strong> –{" "}
          <strong className="text-zinc-300">{summary.team2_goals}</strong>
        </span>
      </div>

      {/* Last meetings */}
      {summary.last_meetings.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2 font-medium">Últimos enfrentamientos</p>
          <div className="space-y-1.5">
            {summary.last_meetings.map((meeting, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm bg-zinc-800/50 rounded-lg px-3 py-2"
              >
                <span className="text-zinc-400 text-xs w-10 shrink-0">
                  {meeting.date ? (
                    <span className="font-mono tabular-nums">
                      {meeting.date.split(" ").slice(-3).join(" ")}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="text-zinc-500 text-xs w-20 truncate shrink-0">
                  {meeting.stage}
                </span>
                <span className="font-bold tabular-nums text-zinc-200">{meeting.score}</span>
                <span className="text-zinc-400 text-xs w-14 text-right truncate shrink-0">
                  {meeting.winner ?? "Empate"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to={`/head-to-head/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`}
        className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors underline underline-offset-2 mt-3 inline-block"
      >
        Ver historial completo
      </Link>
    </div>
  );
}

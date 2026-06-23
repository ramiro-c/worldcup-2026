import type { StatsBombTimelineEvent } from "../../lib/types";

interface EventTimelineProps {
  events: StatsBombTimelineEvent[];
}

function EventIcon({ event }: { event: StatsBombTimelineEvent }) {
  if (event.type === "goal") {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  if (event.type === "card") {
    const isRed = event.cardType === "red";
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isRed ? "bg-red-500/20" : "bg-yellow-500/20"
        }`}
      >
        <div
          className={`w-3 h-4 rounded-sm ${isRed ? "bg-red-400" : "bg-yellow-400"}`}
        />
      </div>
    );
  }
  if (event.type === "substitution") {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      </div>
    );
  }
  return null;
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500 text-sm">
        No hay eventos disponibles
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <h3 className="font-semibold text-zinc-300 mb-4">Eventos del partido</h3>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
            <span className="w-10 text-right text-sm text-zinc-500 tabular-nums flex-shrink-0">
              {event.minute}&apos;
            </span>
            <EventIcon event={event} />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-zinc-100 font-medium truncate block">
                {event.type === "substitution" && event.substitution
                  ? `${event.substitution.playerOn} ← ${event.substitution.playerOff}`
                  : event.player}
              </span>
              <span className="text-xs text-zinc-500 truncate block">
                {event.team}
              </span>
            </div>
            {event.type === "card" && (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  event.cardType === "red"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {event.cardType === "red" ? "ROJA" : "AMARILLA"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventTimeline;

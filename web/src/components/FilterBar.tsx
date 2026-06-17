import type { Team, Venue } from "../lib/types";

interface FilterBarProps {
  teams: Team[];
  venues: Venue[];
  teamFilter: string;
  dateFilter: string;
  venueFilter: string;
  statusFilter: string[];
  onTeamChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onStatusToggle: (status: string) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: "live", label: "En Vivo" },
  { value: "scheduled", label: "Programados" },
  { value: "finished", label: "Finalizados" },
];

export default function FilterBar({
  teams,
  venues,
  teamFilter,
  dateFilter,
  venueFilter,
  statusFilter,
  onTeamChange,
  onDateChange,
  onVenueChange,
  onStatusToggle,
  onClear,
}: FilterBarProps) {
  const hasActiveFilters = teamFilter || dateFilter || venueFilter || statusFilter.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Team dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 font-medium">Equipo</label>
        <div className="relative">
          <select
            value={teamFilter}
            onChange={(e) => onTeamChange(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-sm text-zinc-100 hover:border-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 font-medium">Fecha</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:border-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] cursor-pointer"
        />
      </div>

      {/* Venue dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 font-medium">Sede</label>
        <div className="relative">
          <select
            value={venueFilter}
            onChange={(e) => onVenueChange(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-sm text-zinc-100 hover:border-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todas</option>
            {venues.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Status toggles */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 font-medium">Estado</label>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const active = statusFilter.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onStatusToggle(opt.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

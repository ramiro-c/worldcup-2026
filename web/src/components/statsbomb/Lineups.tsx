import type { StatsBombLineup, StatsBombLineupPlayer } from "../../lib/types";

interface LineupsProps {
  lineups: StatsBombLineup[];
}

function positionCategory(pos?: string): string {
  if (!pos) return "OTROS";
  const p = pos.toLowerCase();
  if (p.includes("goalkeeper")) return "GK";
  if (p.includes("back") || p.includes("defender") || p.includes("defensa")) return "DEF";
  if (p.includes("midfield") || p.includes("mid") || p.includes("mediocampista")) return "MID";
  if (p.includes("forward") || p.includes("striker") || p.includes("delantero")) return "FWD";
  return "OTROS";
}

const CATEGORY_LABELS: Record<string, string> = {
  GK: "Arqueros",
  DEF: "Defensores",
  MID: "Mediocampistas",
  FWD: "Delanteros",
  OTROS: "Otros",
};

const CATEGORY_ORDER = ["GK", "DEF", "MID", "FWD", "OTROS"];

function groupByPosition(players: StatsBombLineupPlayer[]): Map<string, StatsBombLineupPlayer[]> {
  const groups = new Map<string, StatsBombLineupPlayer[]>();
  for (const p of players) {
    const cat = positionCategory(p.position);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(p);
  }
  return groups;
}

function TeamLineup({ team, players, label }: { team: string; players: StatsBombLineupPlayer[]; label: string }) {
  if (players.length === 0) return null;
  const groups = groupByPosition(players);

  return (
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-zinc-300 mb-3">
        {team} <span className="text-xs text-zinc-500 font-normal">{label}</span>
      </h4>
      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => {
          const catPlayers = groups.get(cat);
          if (!catPlayers) return null;
          return (
            <div key={cat}>
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </span>
              <div className="mt-1 space-y-0.5">
                {catPlayers.map((p) => (
                  <div key={p.player} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right text-zinc-500 tabular-nums">
                      {p.jerseyNumber}
                    </span>
                    <span className="text-zinc-100">{p.player}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Lineups({ lineups }: LineupsProps) {
  if (!lineups || lineups.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500 text-sm">
        Alineaciones no disponibles
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <h3 className="font-semibold text-zinc-300 mb-6">Alineaciones</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {lineups.map((lu) => (
          <div key={lu.team} className="space-y-6">
            <TeamLineup
              team={lu.team}
              players={lu.startingXI}
              label="Titulares"
            />
            {lu.substitutes.length > 0 && (
              <TeamLineup
                team={lu.team}
                players={lu.substitutes}
                label="Suplentes"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Lineups;

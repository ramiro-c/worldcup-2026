import type {
  StatsBombTimelineEvent,
  StatsBombShot,
  StatsBombLineup,
} from "./types";

/*
 * Team name normalization map to bridge openfootball ↔ StatsBomb differences.
 */
const NAME_MAP: Record<string, string> = {
  "usa": "united states",
  "korea republic": "south korea",
  "korea dpr": "north korea",
  "ir iran": "iran",
  "côte d'ivoire": "ivory coast",
};

function normalizeTeamName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return NAME_MAP[normalized] ?? normalized;
}

export interface OpenfootballMatchRef {
  team1: { name: string };
  team2: { name: string };
  date: string | null;
}

/**
 * Match an openfootball match to a StatsBomb match by normalized team names + date.
 */
export function matchByTeamsAndDate(
  openfootballMatch: OpenfootballMatchRef,
  statsbombMatches: Record<string, unknown>[],
): Record<string, unknown> | null {
  const { team1, team2, date } = openfootballMatch;
  if (!date) return null;

  const t1 = normalizeTeamName(team1.name);
  const t2 = normalizeTeamName(team2.name);

  return (
    statsbombMatches.find((m) => {
      const homeTeam = (m.home_team as Record<string, unknown>) ?? {};
      const awayTeam = (m.away_team as Record<string, unknown>) ?? {};
      const home = normalizeTeamName(String(homeTeam.home_team_name ?? ""));
      const away = normalizeTeamName(String(awayTeam.away_team_name ?? ""));
      const matchDate = String(m.match_date ?? "");

      return (
        matchDate === date &&
        ((home === t1 && away === t2) || (home === t2 && away === t1))
      );
    }) ?? null
  );
}

// ─── Event parsing ──────────────────────────────────────────────

function mapShotOutcome(outcome: string): StatsBombShot["outcome"] {
  switch (outcome.toLowerCase()) {
    case "goal":
      return "goal";
    case "saved":
      return "saved";
    case "blocked":
      return "blocked";
    case "off target":
      return "off_target";
    case "wayward":
      return "wayward";
    default:
      return "off_target";
  }
}

function getFirstPosition(positions: unknown): string | undefined {
  if (!Array.isArray(positions) || positions.length === 0) return undefined;
  const pos = (positions[0] as Record<string, unknown>) ?? {};
  return String(pos.position ?? "");
}

/**
 * Parse raw StatsBomb events into cleaned timeline events and shot data.
 * Sorts timeline events by minute.
 */
export function parseEvents(
  rawEvents: Record<string, unknown>[],
): { timelineEvents: StatsBombTimelineEvent[]; shots: StatsBombShot[] } {
  const timelineEvents: StatsBombTimelineEvent[] = [];
  const shots: StatsBombShot[] = [];

  for (const ev of rawEvents) {
    const minute = Number(ev.minute) || 0;
    const team = String((ev.team as Record<string, unknown>)?.name ?? "");
    const player = String((ev.player as Record<string, unknown>)?.name ?? "");
    const typeName = String((ev.type as Record<string, unknown>)?.name ?? "");

    if (typeName === "Goal") {
      timelineEvents.push({ minute, type: "goal", team, player });
    } else if (typeName === "Card") {
      const card = (ev.card as Record<string, unknown>) ?? {};
      const cardName = String(card.name ?? "");
      const cardType = cardName.toLowerCase().includes("red") ? "red" : "yellow";
      timelineEvents.push({ minute, type: "card", team, player, cardType });
    } else if (typeName === "Substitution") {
      const sub = (ev.substitution as Record<string, unknown>) ?? {};
      const replacement = (sub.replacement as Record<string, unknown>) ?? {};
      const off = (sub.off as Record<string, unknown>) ?? {};
      const playerOn = String(replacement.name ?? "");
      const playerOff = String(off.name ?? "");
      timelineEvents.push({
        minute,
        type: "substitution",
        team,
        player: playerOn,
        substitution: { playerOff, playerOn },
      });
    }

    // "Shot" events for the shot map (includes goal shots)
    if (typeName === "Shot") {
      const location = ev.location as number[] | undefined;
      if (location && location.length >= 2) {
        const shot = (ev.shot as Record<string, unknown>) ?? {};
        const outcomeRaw = (shot.outcome as Record<string, unknown>) ?? {};
        const outcomeName = String(outcomeRaw.name ?? "");
        shots.push({
          x: location[0],
          y: location[1],
          outcome: mapShotOutcome(outcomeName),
        });
      }
    }
  }

  timelineEvents.sort((a, b) => a.minute - b.minute);
  return { timelineEvents, shots };
}

// ─── Lineup parsing ─────────────────────────────────────────────

/**
 * Parse raw StatsBomb lineups into cleaned data, distinguishing starting XI
 * from substitutes by cross-referencing substitution events.
 */
export function parseLineups(
  rawLineups: Record<string, unknown>[],
  timelineEvents: StatsBombTimelineEvent[],
): StatsBombLineup[] {
  // Collect players who came ON as substitutes via events
  const subPlayerNames = new Set(
    timelineEvents
      .filter((e) => e.type === "substitution" && e.substitution)
      .map((e) => e.substitution!.playerOn),
  );

  return rawLineups.map((raw) => {
    const team = String(raw.team_name ?? "");
    const lineup = (raw.lineup as Record<string, unknown>[]) ?? [];

    const players = lineup.map((p) => ({
      player: String(p.player_name ?? ""),
      jerseyNumber: Number(p.jersey_number) || 0,
      position: getFirstPosition(p.positions),
    }));

    players.sort((a, b) => a.jerseyNumber - b.jerseyNumber);

    const startingXI = players.filter((p) => !subPlayerNames.has(p.player));
    const substitutes = players.filter((p) => subPlayerNames.has(p.player));

    return { team, startingXI, substitutes };
  });
}

// ─── Competition helpers ────────────────────────────────────────

const WORLD_CUP_COMPETITION_IDS = new Set([43, 72]);

/**
 * Check if a StatsBomb competition entry is a World Cup (men's or women's).
 */
export function isWorldCupCompetition(comp: {
  competition_name: string;
  competition_id?: number;
}): boolean {
  if (comp.competition_id && WORLD_CUP_COMPETITION_IDS.has(comp.competition_id)) {
    return true;
  }
  return comp.competition_name.toLowerCase().includes("world cup");
}

import { describe, it, expect } from "vitest";
import {
  matchByTeamsAndDate,
  parseEvents,
  parseLineups,
  isWorldCupCompetition,
} from "./statsbomb";
import type { OpenfootballMatchRef } from "./statsbomb";

// ─── matchByTeamsAndDate ────────────────────────────────────────

describe("matchByTeamsAndDate", () => {
  const matches: Record<string, unknown>[] = [
    {
      match_id: 7576,
      match_date: "2014-06-13",
      home_team: { home_team_name: "Spain" },
      away_team: { away_team_name: "Netherlands" },
    },
    {
      match_id: 7577,
      match_date: "2014-06-13",
      home_team: { home_team_name: "Chile" },
      away_team: { away_team_name: "Australia" },
    },
    {
      match_id: 8654,
      match_date: "2014-07-13",
      home_team: { home_team_name: "Germany" },
      away_team: { away_team_name: "Argentina" },
    },
  ];

  it("finds a match by team names + date", () => {
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "Germany" },
      team2: { name: "Argentina" },
      date: "2014-07-13",
    };
    const result = matchByTeamsAndDate(ofMatch, matches);
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).match_id).toBe(8654);
  });

  it("matches regardless of team order (home/away)", () => {
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "Argentina" },
      team2: { name: "Germany" },
      date: "2014-07-13",
    };
    const result = matchByTeamsAndDate(ofMatch, matches);
    expect((result as Record<string, unknown>).match_id).toBe(8654);
  });

  it("normalizes team names", () => {
    const withUsa: Record<string, unknown>[] = [
      {
        match_id: 123,
        match_date: "2014-06-16",
        home_team: { home_team_name: "United States" },
        away_team: { away_team_name: "Ghana" },
      },
    ];
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "USA" },
      team2: { name: "Ghana" },
      date: "2014-06-16",
    };
    const result = matchByTeamsAndDate(ofMatch, withUsa);
    expect((result as Record<string, unknown>).match_id).toBe(123);
  });

  it("returns null when date is null", () => {
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "Germany" },
      team2: { name: "Argentina" },
      date: null,
    };
    expect(matchByTeamsAndDate(ofMatch, matches)).toBeNull();
  });

  it("returns null when no match found", () => {
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "Brazil" },
      team2: { name: "Uruguay" },
      date: "2014-06-20",
    };
    expect(matchByTeamsAndDate(ofMatch, matches)).toBeNull();
  });

  it("returns null for empty matches array", () => {
    const ofMatch: OpenfootballMatchRef = {
      team1: { name: "Germany" },
      team2: { name: "Argentina" },
      date: "2014-07-13",
    };
    expect(matchByTeamsAndDate(ofMatch, [])).toBeNull();
  });
});

// ─── parseEvents ────────────────────────────────────────────────

describe("parseEvents", () => {
  // Real StatsBomb event shapes (verified against statsbomb/open-data v4.0.0):
  //   - Goals are Shot events with shot.outcome.name === "Goal"
  //   - Cards are Bad Behaviour events with bad_behaviour.card.name
  //   - Substitutions: event.player.name = player OFF, substitution.replacement.name = player ON
  const rawEvents: Record<string, unknown>[] = [
    // Shot that became a goal (Müller, minute 36)
    {
      id: "1",
      minute: 36,
      type: { name: "Shot" },
      team: { name: "Germany" },
      player: { name: "Thomas Müller" },
      location: [108, 41],
      shot: { outcome: { name: "Goal" } },
    },
    // Yellow card via Bad Behaviour
    {
      id: "2",
      minute: 45,
      type: { name: "Bad Behaviour" },
      team: { name: "Argentina" },
      player: { name: "Javier Mascherano" },
      bad_behaviour: { card: { name: "Yellow Card" } },
    },
    // Red card via Bad Behaviour
    {
      id: "3",
      minute: 88,
      type: { name: "Bad Behaviour" },
      team: { name: "Germany" },
      player: { name: "Bastian Schweinsteiger" },
      bad_behaviour: { card: { name: "Red Card" } },
    },
    // Substitution: event.player = OFF, substitution.replacement = ON
    {
      id: "4",
      minute: 70,
      type: { name: "Substitution" },
      team: { name: "Germany" },
      player: { name: "Bastian Schweinsteiger" },
      substitution: {
        outcome: { name: "Tactical" },
        replacement: { id: 9999, name: "Mario Götze" },
      },
    },
    // Plain shot (Saved)
    {
      id: "5",
      minute: 22,
      type: { name: "Shot" },
      team: { name: "Germany" },
      player: { name: "Toni Kroos" },
      location: [105, 35],
      shot: { outcome: { name: "Saved" } },
    },
    // Missed shot (StatsBomb uses "Off T" not "Off Target")
    {
      id: "6",
      minute: 65,
      type: { name: "Shot" },
      team: { name: "Argentina" },
      player: { name: "Lionel Messi" },
      location: [100, 40],
      shot: { outcome: { name: "Off T" } },
    },
  ];

  it("parses Shot+Goal into timeline goal events", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const goals = timelineEvents.filter((e) => e.type === "goal");
    expect(goals).toHaveLength(1);
    expect(goals[0].player).toBe("Thomas Müller");
    expect(goals[0].minute).toBe(36);
  });

  it("parses Bad Behaviour cards with correct color", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const yellows = timelineEvents.filter((e) => e.type === "card" && e.cardType === "yellow");
    const reds = timelineEvents.filter((e) => e.type === "card" && e.cardType === "red");

    expect(yellows).toHaveLength(1);
    expect(yellows[0].player).toBe("Javier Mascherano");

    expect(reds).toHaveLength(1);
    expect(reds[0].player).toBe("Bastian Schweinsteiger");
  });

  it("treats Second Yellow as a red card", () => {
    const events: Record<string, unknown>[] = [
      {
        id: "x",
        minute: 80,
        type: { name: "Bad Behaviour" },
        team: { name: "Argentina" },
        player: { name: "Heitinga" },
        bad_behaviour: { card: { name: "Second Yellow" } },
      },
    ];
    const { timelineEvents } = parseEvents(events);
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0].cardType).toBe("red");
  });

  it("ignores Bad Behaviour events without a card", () => {
    const events: Record<string, unknown>[] = [
      {
        id: "y",
        minute: 30,
        type: { name: "Bad Behaviour" },
        team: { name: "Germany" },
        player: { name: "Neuer" },
        bad_behaviour: { reason: "Time wasting" }, // no card
      },
    ];
    const { timelineEvents } = parseEvents(events);
    expect(timelineEvents).toHaveLength(0);
  });

  it("parses Substitutions with player ON/OFF from real shape", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const subs = timelineEvents.filter((e) => e.type === "substitution");
    expect(subs).toHaveLength(1);
    // Player ON = substitution.replacement.name
    expect(subs[0].substitution?.playerOn).toBe("Mario Götze");
    // Player OFF = event.player.name (NOT substitution.off, which doesn't exist)
    expect(subs[0].substitution?.playerOff).toBe("Bastian Schweinsteiger");
  });

  it("sorts timeline events by minute", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    for (let i = 1; i < timelineEvents.length; i++) {
      expect(timelineEvents[i].minute).toBeGreaterThanOrEqual(timelineEvents[i - 1].minute);
    }
  });

  it("parses Shots with coordinates (including goals)", () => {
    const { shots } = parseEvents(rawEvents);
    expect(shots).toHaveLength(3); // goal shot + saved + off target
    expect(shots[0].x).toBe(108);
    expect(shots[0].y).toBe(41);
    expect(shots[0].outcome).toBe("goal");
    expect(shots[1].outcome).toBe("saved");
    expect(shots[2].outcome).toBe("off_target"); // mapped from "Off T"
  });

  it("ignores events with unknown type", () => {
    const withUnknown = [...rawEvents, { id: "99", minute: 90, type: { name: "Offside" } }];
    const { timelineEvents } = parseEvents(withUnknown);
    expect(timelineEvents).toHaveLength(4); // 1 goal + 2 cards + 1 sub
  });

  it("skips shots without location data", () => {
    const noLocEvents: Record<string, unknown>[] = [
      {
        minute: 10,
        type: { name: "Shot" },
        shot: { outcome: { name: "Goal" } },
        // no location
      },
    ];
    const { shots } = parseEvents(noLocEvents);
    expect(shots).toHaveLength(0);
  });

  it("handles empty input", () => {
    const { timelineEvents, shots } = parseEvents([]);
    expect(timelineEvents).toHaveLength(0);
    expect(shots).toHaveLength(0);
  });
});

// ─── parseLineups ───────────────────────────────────────────────

describe("parseLineups", () => {
  it("distinguishes starting XI from substitutes via positions[].start_reason", () => {
    // Real StatsBomb lineups: starter if any position has start_reason === "Starting XI".
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          {
            player_name: "Manuel Neuer",
            jersey_number: 1,
            positions: [{ position: "Goalkeeper", start_reason: "Starting XI" }],
          },
          {
            player_name: "Bastian Schweinsteiger",
            jersey_number: 7,
            positions: [{ position: "Center Defensive Midfield", start_reason: "Starting XI" }],
          },
          {
            player_name: "Mario Götze",
            jersey_number: 19,
            positions: [{ position: "Center Forward", start_reason: "Substitution - On (Tactical)" }],
          },
        ],
      },
    ];

    const lineups = parseLineups(rawLineups);
    expect(lineups).toHaveLength(1);

    const germanLineup = lineups[0];
    expect(germanLineup.team).toBe("Germany");
    expect(germanLineup.startingXI).toHaveLength(2);
    expect(germanLineup.startingXI.map((p) => p.player)).toContain("Manuel Neuer");
    expect(germanLineup.substitutes).toHaveLength(1);
    expect(germanLineup.substitutes[0].player).toBe("Mario Götze");
  });

  it("counts a player as starter if ANY of their positions started in Starting XI (tactical shift)", () => {
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          {
            player_name: "Damaris Egurrola",
            jersey_number: 12,
            positions: [
              { position: "Right Defensive Midfield", start_reason: "Starting XI", end_reason: "Tactical Shift" },
              { position: "Left Center Back", start_reason: "Tactical Shift" },
            ],
          },
        ],
      },
    ];
    const lineups = parseLineups(rawLineups);
    expect(lineups[0].startingXI).toHaveLength(1);
    expect(lineups[0].substitutes).toHaveLength(0);
  });

  it("treats players with no positions as substitutes", () => {
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          { player_name: "Unused Sub", jersey_number: 23, positions: [] },
        ],
      },
    ];
    const lineups = parseLineups(rawLineups);
    expect(lineups[0].startingXI).toHaveLength(0);
    expect(lineups[0].substitutes).toHaveLength(1);
  });

  it("sorts players by jersey number", () => {
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          { player_name: "Thomas Müller", jersey_number: 13, positions: [] },
          { player_name: "Manuel Neuer", jersey_number: 1, positions: [] },
        ],
      },
    ];

    const lineups = parseLineups(rawLineups, []);
    // No starters (positions are empty) → both end up as substitutes, still sorted.
    expect(lineups[0].substitutes[0].player).toBe("Manuel Neuer");
    expect(lineups[0].substitutes[1].player).toBe("Thomas Müller");
  });

  it("handles missing position data", () => {
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          { player_name: "Player A", jersey_number: 1 },
          { player_name: "Player B", jersey_number: 2 },
        ],
      },
    ];

    expect(() => parseLineups(rawLineups, [])).not.toThrow();
    const lineups = parseLineups(rawLineups, []);
    expect(lineups[0].substitutes[0].position).toBeUndefined();
  });

  it("handles empty input", () => {
    const lineups = parseLineups([], []);
    expect(lineups).toHaveLength(0);
  });
});

// ─── isWorldCupCompetition ──────────────────────────────────────

describe("isWorldCupCompetition", () => {
  it("recognizes World Cup by name", () => {
    expect(isWorldCupCompetition({ competition_name: "FIFA World Cup" })).toBe(true);
  });

  it("recognizes women's World Cup by name", () => {
    expect(isWorldCupCompetition({ competition_name: "FIFA Women's World Cup" })).toBe(true);
  });

  it("recognizes World Cup by competition_id", () => {
    expect(isWorldCupCompetition({ competition_name: "Some Cup", competition_id: 43 })).toBe(true);
  });

  it("rejects non-World-Cup competitions", () => {
    expect(isWorldCupCompetition({ competition_name: "UEFA Euro" })).toBe(false);
    expect(isWorldCupCompetition({ competition_name: "Copa América" })).toBe(false);
  });
});

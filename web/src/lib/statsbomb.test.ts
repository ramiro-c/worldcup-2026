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
  const rawEvents: Record<string, unknown>[] = [
    {
      id: "1",
      minute: 36,
      type: { name: "Goal" },
      team: { name: "Germany" },
      player: { name: "Thomas Müller" },
    },
    {
      id: "2",
      minute: 45,
      type: { name: "Card" },
      team: { name: "Argentina" },
      player: { name: "Javier Mascherano" },
      card: { name: "Yellow Card" },
    },
    {
      id: "3",
      minute: 88,
      type: { name: "Card" },
      team: { name: "Germany" },
      player: { name: "Bastian Schweinsteiger" },
      card: { name: "Red Card" },
    },
    {
      id: "4",
      minute: 70,
      type: { name: "Substitution" },
      team: { name: "Germany" },
      player: { name: "Mario Götze" },
      substitution: {
        replacement: { name: "Mario Götze" },
        off: { name: "Bastian Schweinsteiger" },
      },
    },
    {
      id: "5",
      minute: 22,
      type: { name: "Shot" },
      team: { name: "Germany" },
      player: { name: "Toni Kroos" },
      location: [50, 35],
      shot: { outcome: { name: "Goal" } },
    },
    {
      id: "6",
      minute: 65,
      type: { name: "Shot" },
      team: { name: "Argentina" },
      player: { name: "Lionel Messi" },
      location: [60, 40],
      shot: { outcome: { name: "Saved" } },
    },
  ];

  it("parses Goals into timeline events", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const goals = timelineEvents.filter((e) => e.type === "goal");
    expect(goals).toHaveLength(1);
    expect(goals[0].player).toBe("Thomas Müller");
    expect(goals[0].minute).toBe(36);
  });

  it("parses Cards with correct color", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const yellows = timelineEvents.filter((e) => e.type === "card" && e.cardType === "yellow");
    const reds = timelineEvents.filter((e) => e.type === "card" && e.cardType === "red");

    expect(yellows).toHaveLength(1);
    expect(yellows[0].player).toBe("Javier Mascherano");

    expect(reds).toHaveLength(1);
    expect(reds[0].player).toBe("Bastian Schweinsteiger");
  });

  it("parses Substitutions", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    const subs = timelineEvents.filter((e) => e.type === "substitution");
    expect(subs).toHaveLength(1);
    expect(subs[0].substitution?.playerOn).toBe("Mario Götze");
    expect(subs[0].substitution?.playerOff).toBe("Bastian Schweinsteiger");
  });

  it("sorts timeline events by minute", () => {
    const { timelineEvents } = parseEvents(rawEvents);
    for (let i = 1; i < timelineEvents.length; i++) {
      expect(timelineEvents[i].minute).toBeGreaterThanOrEqual(timelineEvents[i - 1].minute);
    }
  });

  it("parses Shots with coordinates", () => {
    const { shots } = parseEvents(rawEvents);
    expect(shots).toHaveLength(2);
    expect(shots[0].x).toBe(50);
    expect(shots[0].y).toBe(35);
    expect(shots[0].outcome).toBe("goal");
    expect(shots[1].outcome).toBe("saved");
  });

  it("ignores events with unknown type", () => {
    const withUnknown = [...rawEvents, { id: "99", minute: 90, type: { name: "Offside" } }];
    const { timelineEvents } = parseEvents(withUnknown);
    expect(timelineEvents).toHaveLength(4); // goal + 2 cards + 1 sub
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
  it("distinguishes starting XI from substitutes via substitution events", () => {
    const rawLineups: Record<string, unknown>[] = [
      {
        team_name: "Germany",
        lineup: [
          { player_name: "Manuel Neuer", jersey_number: 1, positions: [{ position: "Goalkeeper" }] },
          { player_name: "Bastian Schweinsteiger", jersey_number: 7, positions: [{ position: "Midfielder" }] },
          { player_name: "Mario Götze", jersey_number: 19, positions: [{ position: "Forward" }] },
        ],
      },
    ];

    const timelineEvents = [
      {
        minute: 70,
        type: "substitution" as const,
        team: "Germany",
        player: "Mario Götze",
        substitution: { playerOff: "Bastian Schweinsteiger", playerOn: "Mario Götze" },
      },
    ];

    const lineups = parseLineups(rawLineups, timelineEvents);
    expect(lineups).toHaveLength(1);

    const germanLineup = lineups[0];
    expect(germanLineup.team).toBe("Germany");
    expect(germanLineup.startingXI).toHaveLength(2);
    expect(germanLineup.startingXI.map((p) => p.player)).toContain("Manuel Neuer");
    expect(germanLineup.substitutes).toHaveLength(1);
    expect(germanLineup.substitutes[0].player).toBe("Mario Götze");
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
    expect(lineups[0].startingXI[0].player).toBe("Manuel Neuer");
    expect(lineups[0].startingXI[1].player).toBe("Thomas Müller");
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
    expect(lineups[0].startingXI[0].position).toBeUndefined();
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

import { describe, it, expect } from "vitest";
import type {
  Team,
  Group,
  GroupStanding,
  QualificationStatus,
  GroupWithStandings,
  BestThirdRanking,
} from "./types";

describe("GroupStanding types", () => {
  it("QualificationStatus accepts valid literal values", () => {
    const qualified: QualificationStatus = "qualified";
    const bestThird: QualificationStatus = "best_third";
    const eliminated: QualificationStatus = "eliminated";
    const pending: QualificationStatus = "pending";

    expect(qualified).toBe("qualified");
    expect(bestThird).toBe("best_third");
    expect(eliminated).toBe("eliminated");
    expect(pending).toBe("pending");
  });

  it("GroupStanding has all required fields", () => {
    const team: Team = {
      id: "arg",
      name: "Argentina",
      code: "ARG",
      crest: "https://flagcdn.com/ar.svg",
      group: "a",
    };

    const standing: GroupStanding = {
      team,
      played: 3,
      won: 2,
      drawn: 1,
      lost: 0,
      gf: 5,
      ga: 1,
      gd: 4,
      points: 7,
      position: 1,
      qualification: "qualified",
    };

    expect(standing.team.code).toBe("ARG");
    expect(standing.qualification).toBe("qualified");
    expect(standing.tiebreaker_exhausted).toBeUndefined();
  });

  it("GroupStanding supports tiebreaker_exhausted flag", () => {
    const team: Team = {
      id: "irn",
      name: "Iran",
      code: "IRN",
      crest: "https://flagcdn.com/ir.svg",
      group: "b",
    };
    const standing: GroupStanding = {
      team,
      played: 3,
      won: 1,
      drawn: 2,
      lost: 0,
      gf: 3,
      ga: 3,
      gd: 0,
      points: 5,
      position: 1,
      qualification: "qualified",
      tiebreaker_exhausted: true,
    };
    expect(standing.tiebreaker_exhausted).toBe(true);
  });

  it("GroupWithStandings wraps group with standings", () => {
    const group: Group = {
      id: "a",
      name: "Group A",
      teams: ["arg", "mex", "pol", "ksa"],
    };

    const withStandings: GroupWithStandings = {
      group,
      standings: [],
      complete: true,
    };

    expect(withStandings.group.id).toBe("a");
    expect(withStandings.standings).toHaveLength(0);
    expect(withStandings.complete).toBe(true);
  });

  it("BestThirdRanking has qualified flag and group field", () => {
    const team: Team = {
      id: "mex",
      name: "Mexico",
      code: "MEX",
      crest: "https://flagcdn.com/mx.svg",
      group: "a",
    };

    const ranked: BestThirdRanking = {
      team,
      group: "a",
      played: 3,
      won: 1,
      drawn: 1,
      lost: 1,
      gf: 2,
      ga: 4,
      gd: -2,
      points: 4,
      position: 1,
      qualified: true,
    };

    expect(ranked.qualified).toBe(true);
    expect(ranked.group).toBe("a");
    expect(ranked.position).toBe(1);
  });
});

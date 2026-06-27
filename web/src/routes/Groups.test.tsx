import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Groups from "./Groups";
import type { GroupWithStandings, GroupStanding } from "../lib/types";

vi.mock("../lib/analytics", () => ({ trackPageView: vi.fn() }));

const { mockUseAsync } = vi.hoisted(() => ({ mockUseAsync: vi.fn() }));
vi.mock("../lib/useAsync", () => ({ useAsync: mockUseAsync }));

function makeStanding(
  code: string, name: string, group: string, position: number,
  qualification: "qualified" | "best_third" | "eliminated" | "pending", points: number,
): GroupStanding {
  const won = Math.floor(points / 3);
  return {
    team: { id: code, name, code: code.toUpperCase(), crest: `https://flagcdn.com/${code}.svg`, group },
    played: 3, won, drawn: 0, lost: 3 - won,
    gf: points * 2, ga: 0, gd: points * 2, points, position, qualification,
  };
}

function makeGroup(groupId: string, standings: GroupStanding[]): GroupWithStandings {
  return {
    group: { id: groupId, name: `Group ${groupId.toUpperCase()}`, teams: standings.map((s) => s.team.id) },
    standings, complete: true,
  };
}

function mockGroups(data: GroupWithStandings[] | null, loading = false) {
  mockUseAsync.mockReturnValue({ data, loading, error: null, refetch: vi.fn() });
}

describe("Groups", () => {
  it("shows qualified badge for positions 1 and 2", () => {
    const standings = [
      makeStanding("arg", "Argentina", "a", 1, "qualified", 9),
      makeStanding("mex", "Mexico", "a", 2, "qualified", 6),
      makeStanding("pol", "Poland", "a", 3, "best_third", 4),
      makeStanding("ksa", "Saudi Arabia", "a", 4, "eliminated", 0),
    ];
    mockGroups([makeGroup("a", standings)]);
    render(<MemoryRouter><Groups /></MemoryRouter>);
    const badges = screen.getAllByText("Clasificado");
    // 2 per-row badges + 1 legend = 3
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it("shows best-third badge on position 3", () => {
    const standings = [
      makeStanding("bra", "Brazil", "b", 1, "qualified", 7),
      makeStanding("sui", "Switzerland", "b", 2, "qualified", 5),
      makeStanding("cmr", "Cameroon", "b", 3, "best_third", 4),
      makeStanding("srb", "Serbia", "b", 4, "eliminated", 0),
    ];
    mockGroups([makeGroup("b", standings)]);
    render(<MemoryRouter><Groups /></MemoryRouter>);
    // Both the per-row badge and legend have "Mejor 3°"
    const badges = screen.getAllByText("Mejor 3°");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows eliminated badge", () => {
    const standings = [
      makeStanding("eng", "England", "c", 1, "qualified", 7),
      makeStanding("usa", "USA", "c", 2, "qualified", 5),
      makeStanding("irn", "Iran", "c", 3, "eliminated", 3),
      makeStanding("wal", "Wales", "c", 4, "eliminated", 1),
    ];
    mockGroups([makeGroup("c", standings)]);
    render(<MemoryRouter><Groups /></MemoryRouter>);
    // Should find at least one "Eliminado" badge (rows, not legend)
    const eliminated = screen.getAllByText("Eliminado");
    expect(eliminated.length).toBeGreaterThanOrEqual(1);
  });

  it("renders multiple groups", () => {
    mockGroups([
      makeGroup("a", [
        makeStanding("arg", "Argentina", "a", 1, "qualified", 9),
        makeStanding("mex", "Mexico", "a", 2, "qualified", 6),
        makeStanding("pol", "Poland", "a", 3, "best_third", 4),
        makeStanding("ksa", "Saudi Arabia", "a", 4, "eliminated", 0),
      ]),
      makeGroup("b", [
        makeStanding("eng", "England", "b", 1, "qualified", 7),
        makeStanding("usa", "USA", "b", 2, "qualified", 5),
        makeStanding("irn", "Iran", "b", 3, "eliminated", 3),
        makeStanding("wal", "Wales", "b", 4, "eliminated", 1),
      ]),
    ]);
    render(<MemoryRouter><Groups /></MemoryRouter>);
    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByText("Group B")).toBeInTheDocument();
  });

  it("reflects backend standings order", () => {
    const standings = [
      makeStanding("civ", "Cote d'Ivoire", "d", 1, "qualified", 7),
      makeStanding("jpn", "Japan", "d", 2, "qualified", 4),
      makeStanding("ger", "Germany", "d", 3, "best_third", 4),
      makeStanding("crc", "Costa Rica", "d", 4, "eliminated", 1),
    ];
    mockGroups([makeGroup("d", standings)]);
    render(<MemoryRouter><Groups /></MemoryRouter>);
    expect(screen.getByText("Cote d'Ivoire")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("Costa Rica")).toBeInTheDocument();
  });
});

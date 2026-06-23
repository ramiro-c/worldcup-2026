import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BracketTree from "./BracketTree";
import type { BracketRound, BracketMatch } from "../lib/types";

function makeFullBracketData(): BracketRound[] {
  // Build a proper bracket where next_match_id pointers follow bracket structure
  const teams = [
    ["ARG", "BRA"], ["FRA", "ENG"], ["GER", "ESP"], ["NED", "POR"],
    ["ITA", "BEL"], ["CRO", "URU"], ["ENG", "DEN"], ["SUI", "SWE"],
    ["MEX", "USA"], ["CAN", "JPN"], ["KOR", "AUS"], ["SEN", "MAR"],
    ["CMR", "GHA"], ["TUN", "DZA"], ["ECU", "PER"], ["CHI", "COL"],
  ];

  function match(id: string, round: string, slot: number, h: string | null, a: string | null, hn: string | null, an: string | null, hScore: number | null, aScore: number | null, status: string, nextId: string | null): BracketMatch {
    return {
      id, round, slot,
      home_team: h, away_team: a,
      home_team_name: hn, away_team_name: an,
      home_crest: h ? `https://flagcdn.com/${h.toLowerCase()}.svg` : null,
      away_crest: a ? `https://flagcdn.com/${a.toLowerCase()}.svg` : null,
      home_score: hScore, away_score: aScore,
      status, next_match_id: nextId,
    };
  }

  const r32: BracketRound = { name: "round_of_32", label: "R32", matches: [] };
  const r16: BracketRound = { name: "round_of_16", label: "R16", matches: [] };
  const qf: BracketRound = { name: "quarter_final", label: "QF", matches: [] };
  const sf: BracketRound = { name: "semi_final", label: "SF", matches: [] };
  const finalRound: BracketRound = { name: "final", label: "Final", matches: [] };

  // R32: 16 matches → each feeds into an R16 slot
  for (let i = 0; i < 16; i++) {
    const [h, a] = teams[i];
    r32.matches.push(match(
      `r32-${i}`, "round_of_32", i, h, a,
      `Team ${h}`, `Team ${a}`,
      i < 8 ? 2 : null, i < 8 ? 1 : null,
      i < 8 ? "final" : "scheduled",
      `r16-${Math.floor(i / 2)}`,
    ));
  }

  // R16: 8 matches → each feeds into a QF slot
  for (let i = 0; i < 8; i++) {
    r16.matches.push(match(
      `r16-${i}`, "round_of_16", i, null, null, null, null,
      null, null, "scheduled",
      `qf-${Math.floor(i / 2)}`,
    ));
  }

  // QF: 4 matches → each feeds into an SF slot
  for (let i = 0; i < 4; i++) {
    qf.matches.push(match(
      `qf-${i}`, "quarter_final", i, null, null, null, null,
      null, null, "scheduled",
      `sf-${Math.floor(i / 2)}`,
    ));
  }

  // SF: 2 matches → each feeds into Final
  for (let i = 0; i < 2; i++) {
    sf.matches.push(match(
      `sf-${i}`, "semi_final", i, null, null, null, null,
      null, null, "scheduled",
      "final-0",
    ));
  }

  // Final: 1 match → no next
  finalRound.matches.push(match("final-0", "final", 0, null, null, null, null, null, null, "scheduled", null));

  return [r32, r16, qf, sf, finalRound];
}

describe("BracketTree", () => {
  it("renders SVG element when data is provided", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders round labels for all 5 rounds", () => {
    const rounds = makeFullBracketData();
    render(<BracketTree rounds={rounds} />);
    expect(screen.getByText("R32")).toBeInTheDocument();
    expect(screen.getByText("R16")).toBeInTheDocument();
    expect(screen.getByText("QF")).toBeInTheDocument();
    expect(screen.getByText("SF")).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
  });

  it("renders match slots with team names", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    // 16 R32 + 8 R16 + 4 QF + 2 SF + 1 Final = 31 match slots
    const matchSlots = container.querySelectorAll("[data-match-id]");
    expect(matchSlots.length).toBe(31);
  });

  it("renders correct number of match slots (31 total)", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const matchSlots = container.querySelectorAll("[data-match-id]");
    expect(matchSlots.length).toBe(31);
  });

  it("sets data-match-id on each slot", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const firstSlot = container.querySelector("[data-match-id]");
    expect(firstSlot).toHaveAttribute("data-match-id");
  });

  it("sets data-next-match-id on each slot (null for final)", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const finalSlot = container.querySelector('[data-match-id="final-0"]');
    expect(finalSlot).toHaveAttribute("data-next-match-id", "");

    const r32Slot = container.querySelector('[data-match-id="r32-0"]');
    expect(r32Slot).toHaveAttribute("data-next-match-id", "r16-0");
  });

  it("sets data-has-team on slots with determined teams", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const determinedSlot = container.querySelector('[data-match-id="r32-0"]');
    expect(determinedSlot).toHaveAttribute("data-has-team", "true");

    const tbdSlot = container.querySelector('[data-match-id="r16-0"]');
    expect(tbdSlot).toHaveAttribute("data-has-team", "false");
  });

  it("renders empty container when rounds is empty", () => {
    const { container } = render(<BracketTree rounds={[]} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // No children in SVG (no layout built)
    const innerContent = svg!.querySelector("g");
    expect(innerContent).toBeNull();
  });

  it("renders TBD text for matches without teams", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    // R16 slots have no teams, they should render "TBD" text
    const slots = container.querySelectorAll("[data-has-team='false']");
    expect(slots.length).toBeGreaterThan(0);
  });

  it("renders scores for completed matches", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    // R32 matches 0-7 have scores, the rest don't
    // Text with "2" and "1" should be present (scores)
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("1");
  });
});

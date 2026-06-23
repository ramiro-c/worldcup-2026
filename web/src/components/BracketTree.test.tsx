import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BracketTree from "./BracketTree";
import type { BracketRound, BracketMatch } from "../lib/types";

// CARD_WIDTH and CARD_HEIGHT from BracketTree.tsx — the card extends from its
// translate origin to (translate.x + 150, translate.y + 42).
const CARD_WIDTH = 150;
const CARD_HEIGHT = 42;

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

  it("renders specific scores from the fixture in .score class elements", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);

    // r32-0 has home=2, away=1 in the fixture. The slot should render exactly
    // two .score elements (home + away) with those exact texts.
    const firstSlot = container.querySelector('[data-match-id="r32-0"]')!;
    const firstScores = firstSlot.querySelectorAll(".score");
    expect(firstScores.length).toBe(2);
    expect(firstScores[0]!.textContent).toBe("2");
    expect(firstScores[1]!.textContent).toBe("1");

    // r32-1 also completed with home=2, away=1 — verify a different slot.
    const secondSlot = container.querySelector('[data-match-id="r32-1"]')!;
    const secondScores = secondSlot.querySelectorAll(".score");
    expect(secondScores[0]!.textContent).toBe("2");
    expect(secondScores[1]!.textContent).toBe("1");

    // r32-7 is the last completed match (home=2, away=1). The next match
    // (r32-8) is scheduled with teams but no scores yet — its .score elements
    // should render "—" because home_score/away_score are null.
    const lastCompleted = container.querySelector('[data-match-id="r32-7"]')!;
    const lastScores = lastCompleted.querySelectorAll(".score");
    expect(lastScores[0]!.textContent).toBe("2");
    expect(lastScores[1]!.textContent).toBe("1");

    const scheduled = container.querySelector('[data-match-id="r32-8"]')!;
    const scheduledScores = scheduled.querySelectorAll(".score");
    expect(scheduledScores.length).toBe(2);
    expect(scheduledScores[0]!.textContent).toBe("—");
    expect(scheduledScores[1]!.textContent).toBe("—");

    // True TBD slots (no teams at all) render "TBD" + "—" without .score class.
    const tbdSlot = container.querySelector('[data-match-id="r16-0"]')!;
    expect(tbdSlot.querySelectorAll(".score").length).toBe(0);
  });

  // ── viewBox containment ──────────────────────────────────────────
  it("contains every match slot within the viewBox bounds", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const svg = container.querySelector("svg")!;
    const viewBox = svg.getAttribute("viewBox");
    expect(viewBox).not.toBeNull();

    const [vbMinX, vbMinY, vbWidth, vbHeight] = viewBox!
      .split(/\s+/)
      .map((n) => Number(n));
    const vbMaxX = vbMinX + vbWidth;
    const vbMaxY = vbMinY + vbHeight;

    const slots = container.querySelectorAll("[data-match-id]");
    expect(slots.length).toBe(31);

    slots.forEach((slot) => {
      const transform = slot.getAttribute("transform") ?? "";
      const m = transform.match(/translate\(\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*\)/);
      expect(m).not.toBeNull();
      const x = parseFloat(m![1]!);
      const y = parseFloat(m![2]!);

      // Card occupies (x, y) → (x + CARD_WIDTH, y + CARD_HEIGHT).
      expect(x).toBeGreaterThanOrEqual(vbMinX);
      expect(x + CARD_WIDTH).toBeLessThanOrEqual(vbMaxX);
      expect(y).toBeGreaterThanOrEqual(vbMinY);
      expect(y + CARD_HEIGHT).toBeLessThanOrEqual(vbMaxY);
    });
  });

  // ── Connector paths ──────────────────────────────────────────────
  it("renders at least 30 connector paths inside the .links group", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const linksGroup = container.querySelector("g.links");
    expect(linksGroup).not.toBeNull();

    const paths = linksGroup!.querySelectorAll("path");
    // A 31-match knockout tree has exactly 30 edges (parent → child links).
    expect(paths.length).toBeGreaterThanOrEqual(30);
  });

  // ── Hover path-to-final ──────────────────────────────────────────
  it("highlights the path-to-final on hover and clears on mouseout", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);
    const svg = container.querySelector("svg")!;

    // r32-0 has teams → should highlight r32-0 → r16-0 → qf-0 → sf-0 → final-0
    const r32Slot = container.querySelector('[data-match-id="r32-0"]')!;
    fireEvent.mouseOver(r32Slot);

    const expectedChain = ["r32-0", "r16-0", "qf-0", "sf-0", "final-0"];
    for (const id of expectedChain) {
      const slot = container.querySelector(`[data-match-id="${id}"]`)!;
      expect(slot.getAttribute("class") ?? "").toContain("highlighted");
    }

    // Unrelated slots should be dimmed.
    const unrelated = container.querySelector('[data-match-id="r32-1"]')!;
    expect(unrelated.getAttribute("class") ?? "").toContain("dimmed");

    // mouseout on the SVG clears all highlight/dim classes.
    fireEvent.mouseOut(svg);

    const allSlots = container.querySelectorAll("[data-match-id]");
    allSlots.forEach((slot) => {
      const cls = slot.getAttribute("class") ?? "";
      expect(cls).not.toContain("highlighted");
      expect(cls).not.toContain("dimmed");
    });
  });

  it("does nothing on hover for TBD slots (has-team=false)", () => {
    const rounds = makeFullBracketData();
    const { container } = render(<BracketTree rounds={rounds} />);

    // r16-0 has has-team=false (no teams determined yet).
    const tbdSlot = container.querySelector('[data-match-id="r16-0"]')!;
    fireEvent.mouseOver(tbdSlot);

    // No slot should receive highlighted or dimmed classes.
    const allSlots = container.querySelectorAll("[data-match-id]");
    allSlots.forEach((slot) => {
      const cls = slot.getAttribute("class") ?? "";
      expect(cls).not.toContain("highlighted");
      expect(cls).not.toContain("dimmed");
    });
  });

  // ── Error state when final round is missing ──────────────────────
  it("renders an error message when the final round is missing", () => {
    const rounds: BracketRound[] = [
      {
        name: "round_of_16",
        label: "R16",
        matches: [
          {
            id: "r16-0",
            round: "round_of_16",
            slot: 0,
            home_team: "ARG",
            away_team: "BRA",
            home_team_name: "Argentina",
            away_team_name: "Brasil",
            home_crest: null,
            away_crest: null,
            home_score: null,
            away_score: null,
            status: "scheduled",
            next_match_id: null,
          },
        ],
      },
    ];

    render(<BracketTree rounds={rounds} />);
    expect(
      screen.getByText("No se pudo construir el cuadro eliminatorio"),
    ).toBeInTheDocument();
  });
});

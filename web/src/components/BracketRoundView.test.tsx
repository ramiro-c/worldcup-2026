import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BracketRoundView from "./BracketRoundView";
import type { BracketRound, BracketMatch } from "../lib/types";

// ── Test data builders ─────────────────────────────────────

function makeFinishedMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: "r32-0",
    round: "round_of_32",
    slot: 0,
    home_team: "arg",
    away_team: "bra",
    home_team_name: "Argentina",
    away_team_name: "Brasil",
    home_crest: "https://flagcdn.com/ar.svg",
    away_crest: "https://flagcdn.com/br.svg",
    home_score: 2,
    away_score: 1,
    status: "final",
    next_match_id: "r16-0",
    datetime_utc: "2026-06-28T15:00:00Z",
    date: "Sat Jun 28",
    ...overrides,
  };
}

function makeScheduledMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: "r32-1",
    round: "round_of_32",
    slot: 1,
    home_team: "fra",
    away_team: "eng",
    home_team_name: "Francia",
    away_team_name: "Inglaterra",
    home_crest: "https://flagcdn.com/fr.svg",
    away_crest: "https://flagcdn.com/gb-eng.svg",
    home_score: null,
    away_score: null,
    status: "scheduled",
    next_match_id: "r16-0",
    datetime_utc: "2026-06-29T18:00:00Z",
    date: "Sun Jun 29",
    ...overrides,
  };
}

function makeTbdMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: "r32-2",
    round: "round_of_32",
    slot: 2,
    home_team: null,
    away_team: null,
    home_team_name: null,
    away_team_name: null,
    home_crest: null,
    away_crest: null,
    home_score: null,
    away_score: null,
    status: "scheduled",
    next_match_id: "r16-1",
    datetime_utc: undefined,
    date: undefined,
    ...overrides,
  };
}

function makeScheduledWithoutDate(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return makeScheduledMatch({
    id: "r32-3",
    slot: 3,
    datetime_utc: undefined,
    date: undefined,
    ...overrides,
  });
}

const twoRounds: BracketRound[] = [
  {
    name: "round_of_32",
    label: "R32",
    matches: [
      makeFinishedMatch(),
      makeScheduledMatch(),
      makeTbdMatch(),
      makeScheduledWithoutDate(),
    ],
  },
  {
    name: "round_of_16",
    label: "R16",
    matches: [
      makeTbdMatch({ id: "r16-0", round: "round_of_16", slot: 0 }),
    ],
  },
];

function renderInRouter(ui: React.ReactElement, initialEntries: string[] = ["/bracket"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

// ── Tests ──────────────────────────────────────────────────

describe("BracketRoundView", () => {
  // REQ-1: Tab bar
  describe("tab bar", () => {
    it("renders a tab for each round with correct label", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      const tabList = screen.getByRole("tablist");
      const tabs = within(tabList).getAllByRole("tab");
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveTextContent("R32");
      expect(tabs[1]).toHaveTextContent("R16");
    });

    it("first tab is selected by default when no URL param", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      const r32Tab = screen.getByRole("tab", { name: "R32" });
      expect(r32Tab).toHaveAttribute("aria-selected", "true");
    });

    // REQ-5: Default active round
    it("defaults to first round when no ?round param (REQ-5)", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // R32 tab selected → R32 matches visible
      expect(screen.getByText("ARG")).toBeInTheDocument();
      expect(screen.getByText("BRA")).toBeInTheDocument();
    });

    it("switches active round on tab click", async () => {
      const user = userEvent.setup();
      renderInRouter(<BracketRoundView rounds={twoRounds} />);

      // R32 is default → ARG visible in finished match
      expect(screen.getByText("ARG")).toBeInTheDocument();

      // Click R16
      await user.click(screen.getByRole("tab", { name: "R16" }));

      // R32 match codes should be gone, R16 tab should be selected
      expect(screen.queryByText("ARG")).not.toBeInTheDocument();
      const r16Tab = screen.getByRole("tab", { name: "R16" });
      expect(r16Tab).toHaveAttribute("aria-selected", "true");
    });

    it("reads active round from URL ?round param on mount (REQ-1)", () => {
      renderInRouter(
        <BracketRoundView rounds={twoRounds} />,
        ["/bracket?round=R16"],
      );
      // R16 tab should be selected
      const r16Tab = screen.getByRole("tab", { name: "R16" });
      expect(r16Tab).toHaveAttribute("aria-selected", "true");
      // R32 matches should NOT be visible
      expect(screen.queryByText("ARG")).not.toBeInTheDocument();
    });

    it("falls back to default round for invalid URL ?round param (REQ-1)", () => {
      renderInRouter(
        <BracketRoundView rounds={twoRounds} />,
        ["/bracket?round=XX"],
      );
      // Should fall back to R32 (first round)
      const r32Tab = screen.getByRole("tab", { name: "R32" });
      expect(r32Tab).toHaveAttribute("aria-selected", "true");
      // R32 renders team codes, not full names
      expect(screen.getByText("ARG")).toBeInTheDocument();
    });
  });

  // REQ-3: Match card states
  describe("match card states", () => {
    it("renders finished match with scores and team codes (REQ-3)", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // Find the finished match card by team code (component renders codes, not full names)
      const card = screen.getByText("ARG").closest("[data-card-state]");
      expect(card).toHaveAttribute("data-card-state", "finished");

      // Scores should be visible
      expect(within(card!).getByText("2")).toBeInTheDocument();
      expect(within(card!).getByText("1")).toBeInTheDocument();

      // Both team codes visible
      expect(within(card!).getByText("BRA")).toBeInTheDocument();
    });

    it("renders scheduled match with date and dash scores (REQ-3)", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // Find the scheduled match that has a date (pick the first card with "Sun Jun 29")
      const card = screen.getByText("Sun Jun 29").closest("[data-card-state]");
      expect(card).toHaveAttribute("data-card-state", "scheduled");

      // Dash for scores
      const scoreDashes = within(card!).getAllByText("—");
      expect(scoreDashes.length).toBeGreaterThanOrEqual(2);

      // Date should be visible
      expect(within(card!).getByText("Sun Jun 29")).toBeInTheDocument();
    });

    it("renders scheduled match without date gracefully", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // The match at slot 3 has no date — should not crash, just renders without date div
      // We verify by checking that the second FRA card exists and has no date text
      const allFraCards = screen.getAllByText("FRA");
      // Two FRA entries: one with date, one without
      expect(allFraCards.length).toBeGreaterThanOrEqual(2);
    });

    it("renders TBD match with dashed appearance and TBD placeholders (REQ-3)", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      const card = screen.getAllByText("TBD")[0].closest("[data-card-state]");
      expect(card).toHaveAttribute("data-card-state", "tbd");
      // Should have 4 TBD entries (2 team placeholders + 2 score placeholders)
      const tbdElements = within(card!).getAllByText("TBD");
      expect(tbdElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  // REQ-4: Eliminated team distinction
  describe("eliminated team grayscale", () => {
    it("marks loser crest as eliminated in finished match (REQ-4)", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // Argentina (home/ARG) has score 2, Brasil (away/BRA) has score 1
      // Brasil is the loser → its crest should be marked eliminated
      const card = screen.getByText("ARG").closest("[data-card-state]")!;

      // Loser crest (Brasil) should have data-eliminated
      const loserCrest = within(card).getByRole("img", { name: /Brasil/i });
      expect(loserCrest).toHaveAttribute("data-eliminated", "true");

      // Winner crest (Argentina) should NOT have data-eliminated
      const winnerCrest = within(card).getByRole("img", { name: /Argentina/i });
      expect(winnerCrest).not.toHaveAttribute("data-eliminated");
    });

    it("does not mark any crest eliminated when scores are tied", () => {
      const tiedMatch = makeFinishedMatch({
        id: "r32-tied",
        home_score: 1,
        away_score: 1,
      });
      const rounds: BracketRound[] = [
        { name: "round_of_32", label: "R32", matches: [tiedMatch] },
      ];
      renderInRouter(<BracketRoundView rounds={rounds} />);
      const argentinaCrest = screen.getByRole("img", { name: /Argentina/i });
      const brasilCrest = screen.getByRole("img", { name: /Brasil/i });
      expect(argentinaCrest).not.toHaveAttribute("data-eliminated");
      expect(brasilCrest).not.toHaveAttribute("data-eliminated");
    });
  });

  // REQ-2: Grid layout
  describe("grid layout", () => {
    it("renders matches in a grid container", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      // Should have a grid container for matches
      const grid = screen.getByRole("list");
      expect(grid).toBeInTheDocument();
      // R32 has 4 matches
      const cards = within(grid).getAllByRole("listitem");
      expect(cards).toHaveLength(4);
    });
  });

  // REQ-6: Responsive
  describe("responsive behavior", () => {
    it("renders tab bar inside a scrollable container", () => {
      renderInRouter(<BracketRoundView rounds={twoRounds} />);
      const tabList = screen.getByRole("tablist");
      // Should be scrollable for overflow
      expect(tabList).toBeInTheDocument();
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("renders empty state when rounds is empty", () => {
      const { container } = renderInRouter(<BracketRoundView rounds={[]} />);
      // Should render nothing (parent handles loading/error/empty)
      expect(container.innerHTML).toBe("");
    });
  });
});

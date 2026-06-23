import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeadToHeadCard from "./HeadToHeadCard";
import type { HeadToHeadSummary } from "../lib/types";

const defaultSummary: HeadToHeadSummary = {
  total_matches: 5,
  team1_wins: 3,
  team2_wins: 1,
  draws: 1,
  team1_goals: 10,
  team2_goals: 4,
  last_meetings: [
    {
      year: 2022,
      date: "18 Dec 2022",
      stage: "final",
      score: "3-1",
      winner: "Argentina",
    },
    {
      year: 2010,
      date: "3 Jul 2010",
      stage: "quarter_final",
      score: "4-0",
      winner: "Germany",
    },
  ],
  last_meeting: {
    year: 2022,
    date: "18 Dec 2022",
    stage: "final",
    score: "3-1",
    winner: "Argentina",
  },
};

function renderCard(summary: HeadToHeadSummary = defaultSummary) {
  return render(
    <MemoryRouter>
      <HeadToHeadCard summary={summary} homeTeam="Argentina" awayTeam="Germany" />
    </MemoryRouter>,
  );
}

describe("HeadToHeadCard", () => {
  it("renders the section title", () => {
    renderCard();
    expect(screen.getByText("Historial")).toBeInTheDocument();
  });

  it("shows team1 wins count", () => {
    renderCard();
    expect(screen.getByText("3")).toBeInTheDocument();
    const teamLabels = screen.getAllByText("Argentina");
    expect(teamLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows draws count", () => {
    renderCard();
    const drawLabel = screen.getByText("Empates");
    expect(drawLabel).toBeInTheDocument();
  });

  it("shows team2 wins count", () => {
    renderCard();
    const teamLabels = screen.getAllByText("Germany");
    expect(teamLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows goals summary", () => {
    renderCard();
    expect(screen.getByText(/^Goles:/)).toBeInTheDocument();
  });

  it("renders last meetings list", () => {
    renderCard();
    expect(screen.getByText("Últimos enfrentamientos")).toBeInTheDocument();
    expect(screen.getByText("3-1")).toBeInTheDocument();
    expect(screen.getByText("4-0")).toBeInTheDocument();
  });

  it("shows 'Ver historial completo' link with correct URL", () => {
    renderCard();
    const link = screen.getByText("Ver historial completo");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/head-to-head/Argentina/Germany",
    );
  });

  it("displays winner for non-draw matches", () => {
    renderCard();
    const winners = screen.getAllByText(/^(Argentina|Germany)$/);
    expect(winners.length).toBeGreaterThanOrEqual(2);
  });

  it("displays 'Empate' for draw matches", () => {
    const summary = structuredClone(defaultSummary);
    summary.last_meetings[0].winner = null;
    renderCard(summary);
    const empateElements = screen.getAllByText("Empate");
    expect(empateElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe("HeadToHeadCard empty state", () => {
  it("shows empty message when no matches", () => {
    const emptySummary: HeadToHeadSummary = {
      total_matches: 0,
      team1_wins: 0,
      team2_wins: 0,
      draws: 0,
      team1_goals: 0,
      team2_goals: 0,
      last_meetings: [],
      last_meeting: null,
    };
    renderCard(emptySummary);
    expect(screen.getByText("Sin enfrentamientos previos")).toBeInTheDocument();
  });

  it("does not show stats when empty", () => {
    const emptySummary: HeadToHeadSummary = {
      total_matches: 0,
      team1_wins: 0,
      team2_wins: 0,
      draws: 0,
      team1_goals: 0,
      team2_goals: 0,
      last_meetings: [],
      last_meeting: null,
    };
    renderCard(emptySummary);
    expect(screen.queryByText("Últimos enfrentamientos")).not.toBeInTheDocument();
  });

  it("shows 'Ver historial completo' link in empty state too", () => {
    const emptySummary: HeadToHeadSummary = {
      total_matches: 0,
      team1_wins: 0,
      team2_wins: 0,
      draws: 0,
      team1_goals: 0,
      team2_goals: 0,
      last_meetings: [],
      last_meeting: null,
    };
    renderCard(emptySummary);
    const link = screen.getByText("Ver historial completo");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/head-to-head/Argentina/Germany",
    );
  });
});

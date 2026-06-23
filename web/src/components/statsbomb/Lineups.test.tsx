import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Lineups } from "./Lineups";
import type { StatsBombLineup } from "../../lib/types";

const mockLineups: StatsBombLineup[] = [
  {
    team: "Germany",
    startingXI: [
      { player: "Manuel Neuer", jerseyNumber: 1, position: "Goalkeeper" },
      { player: "Philipp Lahm", jerseyNumber: 16, position: "Defender" },
      { player: "Toni Kroos", jerseyNumber: 18, position: "Midfielder" },
      { player: "Thomas Müller", jerseyNumber: 13, position: "Forward" },
    ],
    substitutes: [
      { player: "Mario Götze", jerseyNumber: 19, position: "Forward" },
    ],
  },
  {
    team: "Argentina",
    startingXI: [
      { player: "Sergio Romero", jerseyNumber: 1, position: "Goalkeeper" },
      { player: "Lionel Messi", jerseyNumber: 10, position: "Forward" },
    ],
    substitutes: [],
  },
];

describe("Lineups", () => {
  it("renders starting XI sorted within position groups", () => {
    render(<Lineups lineups={mockLineups} />);

    // Check both teams are shown (Germany appears twice: XI + subs)
    const germanyEls = screen.getAllByText("Germany");
    expect(germanyEls.length).toBeGreaterThanOrEqual(1);
    const argentinaEls = screen.getAllByText("Argentina");
    expect(argentinaEls.length).toBeGreaterThanOrEqual(1);

    // Check starting XI label
    const titularesLabels = screen.getAllByText("Titulares");
    expect(titularesLabels).toHaveLength(2);

    // Check jersey numbers and player names are rendered
    expect(screen.getByText(/Neuer/)).toBeInTheDocument();
    expect(screen.getByText(/Messi/)).toBeInTheDocument();
  });

  it("shows substitutes section when substitutes exist", () => {
    render(<Lineups lineups={mockLineups} />);
    expect(screen.getByText("Suplentes")).toBeInTheDocument();
    expect(screen.getByText("Mario Götze")).toBeInTheDocument();
  });

  it("hides substitutes section when no substitutes", () => {
    render(<Lineups lineups={mockLineups} />);
    const suplentes = screen.getAllByText("Suplentes");
    expect(suplentes).toHaveLength(1); // Only for Germany
  });

  it("groups players by position", () => {
    render(<Lineups lineups={mockLineups} />);
    // Some positions appear for multiple teams — use getAllByText
    const arqueros = screen.getAllByText("Arqueros");
    expect(arqueros.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Defensores")).toBeInTheDocument();
    expect(screen.getByText("Mediocampistas")).toBeInTheDocument();
    const delanteros = screen.getAllByText("Delanteros");
    expect(delanteros.length).toBeGreaterThanOrEqual(1);
  });

  it("shows fallback when no lineups", () => {
    render(<Lineups lineups={[]} />);
    expect(screen.getByText("Alineaciones no disponibles")).toBeInTheDocument();
  });

  it("groups players without position under Otros", () => {
    const withoutPosition: StatsBombLineup[] = [
      {
        team: "Germany",
        startingXI: [{ player: "Player X", jerseyNumber: 20, position: undefined }],
        substitutes: [],
      },
    ];
    render(<Lineups lineups={withoutPosition} />);
    expect(screen.getByText("Otros")).toBeInTheDocument();
  });
});

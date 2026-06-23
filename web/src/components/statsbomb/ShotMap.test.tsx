import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShotMap } from "./ShotMap";
import type { StatsBombShot } from "../../lib/types";

describe("ShotMap", () => {
  const shots: StatsBombShot[] = [
    { x: 50, y: 35, outcome: "goal" },
    { x: 60, y: 40, outcome: "saved" },
    { x: 45, y: 50, outcome: "blocked" },
    { x: 70, y: 20, outcome: "off_target" },
    { x: 30, y: 60, outcome: "wayward" },
  ];

  it("renders section title", () => {
    render(<ShotMap shots={shots} />);
    expect(screen.getByText("Mapa de tiros")).toBeInTheDocument();
  });

  it("renders shot map SVG", () => {
    render(<ShotMap shots={shots} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-label", "Shot map");
  });

  it("renders correct number of shot dots in legend", () => {
    render(<ShotMap shots={shots} />);
    expect(screen.getByText(/Gol \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Atajado \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bloqueado \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Desviado \(2\)/)).toBeInTheDocument();
  });

  it("returns null when shots array is empty", () => {
    const { container } = render(<ShotMap shots={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows only goal shot in count", () => {
    const onlyGoals: StatsBombShot[] = [
      { x: 50, y: 35, outcome: "goal" },
      { x: 60, y: 40, outcome: "goal" },
    ];
    render(<ShotMap shots={onlyGoals} />);
    expect(screen.getByText(/Gol \(2\)/)).toBeInTheDocument();
  });

  it("shows only non-goal shots", () => {
    const noGoals: StatsBombShot[] = [
      { x: 50, y: 35, outcome: "saved" },
      { x: 60, y: 40, outcome: "blocked" },
    ];
    render(<ShotMap shots={noGoals} />);
    expect(screen.getByText(/Gol \(0\)/)).toBeInTheDocument();
  });
});

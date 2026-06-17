import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NavGrid from "./NavGrid";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const sampleItems = [
  { label: "Grupos", to: "/groups", description: "Tabla de posiciones" },
  { label: "Fixture", to: "/fixtures", description: "Todos los partidos" },
];

describe("NavGrid", () => {
  it("renders each item as a link with its label and description", () => {
    renderWithRouter(<NavGrid items={sampleItems} />);

    expect(screen.getByText("Grupos")).toBeInTheDocument();
    expect(screen.getByText("Fixture")).toBeInTheDocument();
    expect(screen.getByText("Tabla de posiciones")).toBeInTheDocument();
    expect(screen.getByText("Todos los partidos")).toBeInTheDocument();
  });

  it("links each item to its correct path", () => {
    renderWithRouter(<NavGrid items={sampleItems} />);

    const groupsLink = screen.getByText("Grupos").closest("a");
    expect(groupsLink).toHaveAttribute("href", "/groups");

    const fixturesLink = screen.getByText("Fixture").closest("a");
    expect(fixturesLink).toHaveAttribute("href", "/fixtures");
  });

  it("returns null when items array is empty", () => {
    const { container } = renderWithRouter(<NavGrid items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders items inside a nav element with grid classes", () => {
    renderWithRouter(<NavGrid items={sampleItems} />);

    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("grid");
  });

  it("renders a single item without crashing", () => {
    renderWithRouter(<NavGrid items={[{ label: "Solo", to: "/solo", description: "Único" }]} />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("Único")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumbs />
    </MemoryRouter>,
  );
}

describe("Breadcrumbs", () => {
  it("shows 'Inicio' root link on any path", () => {
    renderAtPath("/tv");
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Inicio").closest("a")).toHaveAttribute("href", "/");
  });

  it("renders 'TV' segment label for /tv path", () => {
    renderAtPath("/tv");
    expect(screen.getByText("TV")).toBeInTheDocument();
  });

  it("renders nothing on root path", () => {
    const { container } = renderAtPath("/");
    expect(container.innerHTML).toBe("");
  });

  it("skips intermediate 'team' segment and shows team name for /team/:name", () => {
    renderAtPath("/team/Brazil");
    // Should NOT have a link to /team (which would 404)
    expect(screen.queryByText("Equipo")).not.toBeInTheDocument();
    // Should show the decoded team name
    expect(screen.getByText("Brazil")).toBeInTheDocument();
  });

  it("decodes URI-encoded team names in breadcrumb", () => {
    renderAtPath("/team/United%20States");
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("skips intermediate 'venues' segment for /venues/:id", () => {
    renderAtPath("/venues/stadium-123");
    expect(screen.queryByText("Sedes")).not.toBeInTheDocument();
    expect(screen.getByText("stadium-123")).toBeInTheDocument();
  });

  it("handles historical tournament path correctly", () => {
    renderAtPath("/historical/2022");
    expect(screen.getByText("Historial")).toBeInTheDocument();
    expect(screen.getByText("Mundial 2022")).toBeInTheDocument();
  });
});

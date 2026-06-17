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
});

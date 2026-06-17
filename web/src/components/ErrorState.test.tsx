import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ErrorState from "./ErrorState";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ErrorState", () => {
  it("renders the error message", () => {
    renderWithRouter(<ErrorState message="Something broke" />);
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("shows retry button when onRetry is provided", () => {
    renderWithRouter(<ErrorState message="Oops" onRetry={() => {}} />);
    expect(
      screen.getByRole("button", { name: /reintentar/i }),
    ).toBeInTheDocument();
  });

  it("hides retry button when onRetry is not provided", () => {
    renderWithRouter(<ErrorState message="Oops" />);
    expect(
      screen.queryByRole("button", { name: /reintentar/i }),
    ).not.toBeInTheDocument();
  });

  it("shows back link when backTo is provided", () => {
    renderWithRouter(
      <ErrorState message="Oops" backTo={{ to: "/", label: "Volver al inicio" }} />,
    );
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toHaveAttribute("href", "/");
  });

  it("uses custom title when provided", () => {
    renderWithRouter(<ErrorState message="Oops" title="Custom Error Title" />);
    expect(screen.getByRole("heading", { name: /custom error title/i })).toBeInTheDocument();
  });

  it("uses default title when no title is provided", () => {
    renderWithRouter(<ErrorState message="Oops" />);
    expect(screen.getByRole("heading", { name: /algo salió mal/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<ErrorState message="Oops" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

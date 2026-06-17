import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Tv from "./Tv";
import * as api from "../lib/api";
import type { TvChannel } from "../lib/types";

vi.mock("../lib/api", () => ({
  getTv: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockChannels: TvChannel[] = [
  { id: "1", name: "ESPN", country: "Argentina" },
  { id: "2", name: "Fox Sports", country: "Argentina" },
  { id: "3", name: "Telemundo", country: "USA" },
  { id: "4", name: "Univision", country: "USA" },
  { id: "5", name: "BBC", country: "UK" },
];

describe("Tv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders channels grouped by country on successful fetch", async () => {
    vi.mocked(api.getTv).mockResolvedValue(mockChannels);

    renderWithRouter(<Tv />);

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toContain("Argentina");
    expect(headings.map((h) => h.textContent)).toContain("USA");
    expect(headings.map((h) => h.textContent)).toContain("UK");

    expect(screen.getByText("ESPN")).toBeInTheDocument();
    expect(screen.getByText("Fox Sports")).toBeInTheDocument();
  });

  it("shows 'No hay canales disponibles' when empty array", async () => {
    vi.mocked(api.getTv).mockResolvedValue([]);

    renderWithRouter(<Tv />);

    await waitFor(() => {
      expect(screen.getByText("No hay canales disponibles")).toBeInTheDocument();
    });
  });

  it("renders ErrorState with retry on API failure", async () => {
    vi.mocked(api.getTv).mockRejectedValue(new Error("Failed to fetch"));

    renderWithRouter(<Tv />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /reintentar/i }),
    ).toBeInTheDocument();
  });

  it("retries API call when retry button is clicked", async () => {
    vi.mocked(api.getTv).mockRejectedValueOnce(new Error("Failed"));
    vi.mocked(api.getTv).mockResolvedValueOnce(mockChannels);

    const user = userEvent.setup();
    renderWithRouter(<Tv />);

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText("ESPN")).toBeInTheDocument();
    });
  });

  it("filters channels by selected country", async () => {
    vi.mocked(api.getTv).mockResolvedValue(mockChannels);

    const user = userEvent.setup();
    renderWithRouter(<Tv />);

    await screen.findAllByRole("heading", { level: 3 });

    await user.click(screen.getByRole("button", { name: /^argentina$/i }));

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Argentina");

    const channels = screen.getAllByRole("listitem");
    expect(channels).toHaveLength(2);
    expect(channels[0]).toHaveTextContent("ESPN");
    expect(channels[1]).toHaveTextContent("Fox Sports");
  });

  it("resets filter when clicking Todas", async () => {
    vi.mocked(api.getTv).mockResolvedValue(mockChannels);

    const user = userEvent.setup();
    renderWithRouter(<Tv />);

    await screen.findAllByRole("heading", { level: 3 });

    // Filter to Argentina only
    await user.click(screen.getByRole("button", { name: /^argentina$/i }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);

    // Click "Todas" to reset
    await user.click(screen.getByRole("button", { name: /todas/i }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("does not render LiveWidget", async () => {
    vi.mocked(api.getTv).mockResolvedValue(mockChannels);

    renderWithRouter(<Tv />);

    await screen.findAllByRole("heading", { level: 3 });

    expect(screen.queryByText("LiveWidget")).not.toBeInTheDocument();
  });
});

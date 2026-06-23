import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsBombTimeline } from "./StatsBombTimeline";

// Mock the API module
vi.mock("../../lib/api", () => ({
  getHistoricalCompetitions: vi.fn(),
  getHistoricalMatches: vi.fn(),
  getHistoricalMatchEvents: vi.fn(),
  getHistoricalMatchLineups: vi.fn(),
}));

import {
  getHistoricalCompetitions,
  getHistoricalMatches,
  getHistoricalMatchEvents,
  getHistoricalMatchLineups,
} from "../../lib/api";

const mockCompetitions = [
  { competition_id: 43, season_id: 3, competition_name: "FIFA World Cup", season_name: "2014" },
];

const mockMatches = [
  {
    match_id: 8654,
    match_date: "2014-07-13",
    home_team: { home_team_name: "Germany" },
    away_team: { away_team_name: "Argentina" },
  },
];

const mockEvents: Record<string, unknown>[] = [
  // Goal as Shot (real StatsBomb shape)
  {
    id: "1",
    minute: 113,
    type: { name: "Shot" },
    team: { name: "Germany" },
    player: { name: "Mario Götze" },
    location: [110, 41],
    shot: { outcome: { name: "Goal" } },
  },
  // Non-goal shot (still appears on shot map)
  {
    id: "2",
    minute: 28,
    type: { name: "Shot" },
    team: { name: "Germany" },
    player: { name: "Toni Kroos" },
    location: [105, 38],
    shot: { outcome: { name: "Goal" } },
  },
  // Yellow card via Bad Behaviour
  {
    id: "3",
    minute: 45,
    type: { name: "Bad Behaviour" },
    team: { name: "Argentina" },
    player: { name: "Javier Mascherano" },
    bad_behaviour: { card: { name: "Yellow Card" } },
  },
];

const mockLineups: Record<string, unknown>[] = [
  {
    team_name: "Germany",
    lineup: [
      {
        player_name: "Manuel Neuer",
        jersey_number: 1,
        positions: [{ position: "Goalkeeper", start_reason: "Starting XI" }],
      },
    ],
  },
  {
    team_name: "Argentina",
    lineup: [
      {
        player_name: "Sergio Romero",
        jersey_number: 1,
        positions: [{ position: "Goalkeeper", start_reason: "Starting XI" }],
      },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StatsBombTimeline", () => {
  it("shows skeleton while loading", () => {
    vi.mocked(getHistoricalCompetitions).mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <StatsBombTimeline year={2014} team1="Germany" team2="Argentina" date="2014-07-13" />,
    );
    // Should show skeleton (we check for the container being present)
    expect(document.querySelector(".space-y-4")).toBeInTheDocument();
  });

  it("shows no-coverage when competition not found", async () => {
    vi.mocked(getHistoricalCompetitions).mockResolvedValue([]);
    render(
      <StatsBombTimeline year={1962} team1="Brazil" team2="Czechoslovakia" date="1962-06-17" />,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Cobertura de StatsBomb no disponible para este partido"),
      ).toBeInTheDocument();
    });
  });

  it("shows no-coverage when season not found", async () => {
    vi.mocked(getHistoricalCompetitions).mockResolvedValue(mockCompetitions);
    render(
      <StatsBombTimeline year={1910} team1="Team A" team2="Team B" date="1910-01-01" />,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Cobertura de StatsBomb no disponible para este partido"),
      ).toBeInTheDocument();
    });
  });

  it("shows no-coverage when match not found in StatsBomb matches", async () => {
    vi.mocked(getHistoricalCompetitions).mockResolvedValue(mockCompetitions);
    vi.mocked(getHistoricalMatches).mockResolvedValue([]);
    render(
      <StatsBombTimeline year={2014} team1="Unmatched" team2="Teams" date="2014-07-13" />,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Cobertura de StatsBomb no disponible para este partido"),
      ).toBeInTheDocument();
    });
  });

  it("renders timeline, lineups, and shot map on successful load", async () => {
    vi.mocked(getHistoricalCompetitions).mockResolvedValue(mockCompetitions);
    vi.mocked(getHistoricalMatches).mockResolvedValue(mockMatches);
    vi.mocked(getHistoricalMatchEvents).mockResolvedValue(mockEvents);
    vi.mocked(getHistoricalMatchLineups).mockResolvedValue(mockLineups);

    render(
      <StatsBombTimeline year={2014} team1="Germany" team2="Argentina" date="2014-07-13" />,
    );

    // Should show the StatsBomb section header
    await waitFor(() => {
      expect(screen.getByText("Datos StatsBomb")).toBeInTheDocument();
    });

    // Should show event timeline
    expect(screen.getByText("Eventos del partido")).toBeInTheDocument();
    expect(screen.getByText("Mario Götze")).toBeInTheDocument();

    // Should show lineups
    expect(screen.getByText("Alineaciones")).toBeInTheDocument();

    // Should show shot map
    expect(screen.getByText("Mapa de tiros")).toBeInTheDocument();

    // Should show attribution link
    const attributionLinks = screen.getAllByText(/StatsBomb/);
    expect(attributionLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state on API failure", async () => {
    vi.mocked(getHistoricalCompetitions).mockRejectedValue(new Error("Network failure"));
    render(
      <StatsBombTimeline year={2014} team1="Germany" team2="Argentina" date="2014-07-13" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos de StatsBomb/)).toBeInTheDocument();
    });

    // Retry button should be present
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("handles partial failure (events fail, lineups succeed)", async () => {
    vi.mocked(getHistoricalCompetitions).mockResolvedValue(mockCompetitions);
    vi.mocked(getHistoricalMatches).mockResolvedValue(mockMatches);
    vi.mocked(getHistoricalMatchEvents).mockRejectedValue(new Error("Events failed"));
    vi.mocked(getHistoricalMatchLineups).mockResolvedValue(mockLineups);

    render(
      <StatsBombTimeline year={2014} team1="Germany" team2="Argentina" date="2014-07-13" />,
    );

    // Events failing should not crash - they become empty array
    await waitFor(() => {
      expect(screen.getByText("Datos StatsBomb")).toBeInTheDocument();
    });
    expect(screen.getByText("No hay eventos disponibles")).toBeInTheDocument();

    // Lineups should still show
    expect(screen.getByText("Alineaciones")).toBeInTheDocument();
  });

  it("retry button re-triggers the fetch on error", async () => {
    const user = userEvent.setup();
    // First call rejects, second call resolves.
    vi.mocked(getHistoricalCompetitions)
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce(mockCompetitions);
    vi.mocked(getHistoricalMatches).mockResolvedValue(mockMatches);
    vi.mocked(getHistoricalMatchEvents).mockResolvedValue(mockEvents);
    vi.mocked(getHistoricalMatchLineups).mockResolvedValue(mockLineups);

    render(
      <StatsBombTimeline year={2014} team1="Germany" team2="Argentina" date="2014-07-13" />,
    );

    // Wait for the error state.
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos de StatsBomb/)).toBeInTheDocument();
    });

    // The competitions endpoint should have been called exactly once so far.
    expect(getHistoricalCompetitions).toHaveBeenCalledTimes(1);

    // Click retry and verify the effect re-runs (competitions called again).
    await user.click(screen.getByText("Reintentar"));

    await waitFor(() => {
      expect(getHistoricalCompetitions).toHaveBeenCalledTimes(2);
    });

    // After retry, the data should load.
    await waitFor(() => {
      expect(screen.getByText("Datos StatsBomb")).toBeInTheDocument();
    });
  });
});

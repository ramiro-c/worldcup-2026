import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Stats from "./Stats";
import * as api from "../lib/api";
import type { TournamentStats } from "../lib/types";

vi.mock("../lib/api", () => ({
  getTournamentStats: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const baseStats: TournamentStats = {
  champion_counts: [
    { country: "Brazil", count: 5 },
    { country: "Germany", count: 4 },
    { country: "Italy", count: 4 },
    { country: "Argentina", count: 3 },
    { country: "France", count: 2 },
    { country: "Uruguay", count: 2 },
    { country: "England", count: 1 },
    { country: "Spain", count: 1 },
  ],
  biggest_wins: [
    { year: 1954, team1: "Hungary", team2: "Korea Republic", score: "9-0", margin: 9, stage: "Group" },
    { year: 1974, team1: "Yugoslavia", team2: "Zaire", score: "9-0", margin: 9, stage: "Group" },
    { year: 1982, team1: "Hungary", team2: "El Salvador", score: "10-1", margin: 9, stage: "Group" },
    { year: 2002, team1: "Germany", team2: "Saudi Arabia", score: "8-0", margin: 8, stage: "Group" },
    { year: 2010, team1: "Portugal", team2: "Korea DPR", score: "7-0", margin: 7, stage: "Group" },
  ],
  total_goals: {
    overall: 2548,
    avg_per_tournament: 28.09,
  },
  host_records: [
    { year: 1930, host: "Uruguay", champion: "Uruguay" },
    { year: 1934, host: "Italy", champion: "Italy" },
    { year: 1938, host: "France", champion: "Italy" },
    { year: 1950, host: "Brazil", champion: "Uruguay" },
    { year: 2022, host: "Qatar", champion: "Argentina" },
    { year: 2026, host: "USA", champion: "—" },
  ],
  top_scorers: [
    { player: "Miroslav Klose", team: "Germany", goals: 16, tournaments: [2002, 2006, 2010, 2014] },
    { player: "Ronaldo", team: "Brazil", goals: 15, tournaments: [1998, 2002, 2006] },
    { player: "Gerd Müller", team: "Germany", goals: 14, tournaments: [1970, 1974] },
  ],
};

describe("Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton on initial render", () => {
    // Promise that never resolves → useAsync stays in loading state
    vi.mocked(api.getTournamentStats).mockReturnValue(new Promise(() => {}));

    renderWithRouter(<Stats />);

    // Heading from loaded state is not present yet
    expect(screen.queryByText("Estadísticas Históricas")).not.toBeInTheDocument();
    // Retry button is not present
    expect(screen.queryByRole("button", { name: /reintentar/i })).not.toBeInTheDocument();
    // Skeleton markers (animate-shimmer / animate-pulse class on divs) are present
    const skeletons = document.querySelectorAll(".animate-shimmer, .animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows RetryButton with 'Estadísticas no disponibles' on error", async () => {
    vi.mocked(api.getTournamentStats).mockRejectedValue(new Error("Network down"));

    renderWithRouter(<Stats />);

    await waitFor(() => {
      expect(screen.getByText("Estadísticas no disponibles")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("retries the fetch when the retry button is clicked", async () => {
    vi.mocked(api.getTournamentStats)
      .mockRejectedValueOnce(new Error("First call fails"))
      .mockResolvedValueOnce(baseStats);

    const user = userEvent.setup();
    renderWithRouter(<Stats />);

    await waitFor(() => {
      expect(screen.getByText("Estadísticas no disponibles")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText("Estadísticas Históricas")).toBeInTheDocument();
    });
    expect(api.getTournamentStats).toHaveBeenCalledTimes(2);
  });

  it("renders all five main sections on successful fetch", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    expect(await screen.findByText("Estadísticas Históricas")).toBeInTheDocument();
    expect(screen.getByText("Campeones")).toBeInTheDocument();
    expect(screen.getByText("Mayores Goleadas")).toBeInTheDocument();
    expect(screen.getByText("Totales")).toBeInTheDocument();
    expect(screen.getByText("Goleadores Históricos")).toBeInTheDocument();
    expect(screen.getByText("Anfitriones")).toBeInTheDocument();
  });

  it("renders champion leaderboard with countries and counts", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    // Each champion country has at least one link to /team/{country}
    expect((await screen.findAllByRole("link", { name: /Brazil/ })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Germany/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Italy/ }).length).toBeGreaterThan(0);

    // Top champion (Brazil = 5) — at least one of the Brazil links shows the count
    const brazilLinks = screen.getAllByRole("link", { name: /Brazil/ });
    expect(brazilLinks.some((l) => l.textContent?.includes("5"))).toBe(true);
  });

  it("renders top 10 champions even when champion_counts has more", async () => {
    // 8 base + 5 new = 13 entries → top 10 rendered, 3 hidden
    const manyChampions: TournamentStats = {
      ...baseStats,
      champion_counts: [
        ...baseStats.champion_counts,
        { country: "Netherlands", count: 0 },
        { country: "Czechoslovakia", count: 0 },
        { country: "Hungary", count: 0 },
        { country: "Poland", count: 0 },
        { country: "Sweden", count: 0 },
      ],
    };
    vi.mocked(api.getTournamentStats).mockResolvedValue(manyChampions);

    renderWithRouter(<Stats />);

    // Top 10 are rendered (Brazil, Spain, etc. are in the top 8)
    expect((await screen.findAllByRole("link", { name: /Brazil/ })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Spain/ }).length).toBeGreaterThan(0);
    // Entries 11, 12, 13 are not rendered as champion links
    expect(screen.queryByRole("link", { name: /Poland/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sweden/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Hungary/ })).not.toBeInTheDocument();
    // Footer shows remaining count
    expect(screen.getByText(/\+3 países/)).toBeInTheDocument();
  });

  it("renders biggest wins with year, score, teams and margin badge", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    // Wait for data to load
    expect(await screen.findByText("Mayores Goleadas")).toBeInTheDocument();

    // Hungary appears in two biggest-wins entries (1954 and 1982) — at least one is shown
    const hungaryRows = screen.getAllByText("Hungary", { exact: false });
    expect(hungaryRows.length).toBeGreaterThan(0);
    expect(screen.getByText("Korea Republic", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("9-0").length).toBeGreaterThan(0);
    // +9 margin badge — there are 3 wins with margin 9
    expect(screen.getAllByText("+9").length).toBeGreaterThan(0);
    // 1954 is the year of the Hungary vs Korea Republic game
    expect(screen.getByText("1954")).toBeInTheDocument();
  });

  it("renders totals with localized number and averages", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    await screen.findByText("Totales");
    // 2548 → "2,548" via toLocaleString
    expect(screen.getByText("2,548")).toBeInTheDocument();
    // avg_per_tournament is rendered too
    expect(screen.getByText("28.09")).toBeInTheDocument();
    // Distinct champion countries (8 in base data) — scope to the Totals card
    // to avoid clashing with the "8" index of the 8th champion
    const totalesCard = screen.getByText("Totales").closest("div");
    expect(totalesCard).toHaveTextContent("8");
  });

  it("renders top scorers in a table with goals and tournament counts", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    expect(await screen.findByText("Miroslav Klose")).toBeInTheDocument();
    expect(screen.getByText("Ronaldo")).toBeInTheDocument();
    expect(screen.getByText("Gerd Müller")).toBeInTheDocument();

    // Goals column
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("shows 'Sin datos de goleadores' when top_scorers is empty", async () => {
    const emptyScorers: TournamentStats = {
      ...baseStats,
      top_scorers: [],
    };
    vi.mocked(api.getTournamentStats).mockResolvedValue(emptyScorers);

    renderWithRouter(<Stats />);

    expect(await screen.findByText("Goleadores Históricos")).toBeInTheDocument();
    expect(screen.getByText("Sin datos de goleadores")).toBeInTheDocument();
    // No scorer rows
    expect(screen.queryByText("Miroslav Klose")).not.toBeInTheDocument();
  });

  it("shows amber warning banner when skipped_tournaments has entries", async () => {
    const withSkipped: TournamentStats = {
      ...baseStats,
      skipped_tournaments: [1930, 1950],
    };
    vi.mocked(api.getTournamentStats).mockResolvedValue(withSkipped);

    renderWithRouter(<Stats />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se pudieron cargar los datos de");
    expect(alert).toHaveTextContent("1930, 1950");
  });

  it("does NOT show the warning banner when skipped_tournaments is missing or empty", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    await screen.findByText("Estadísticas Históricas");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders host records with year, host and champion, filtering out year 2026", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    expect(await screen.findByText("Anfitriones")).toBeInTheDocument();
    // Pre-2026 records show
    expect(screen.getByText("1930")).toBeInTheDocument();
    expect(screen.getByText("2022")).toBeInTheDocument();
    // 2026 record must be filtered out
    expect(screen.queryByText("2026")).not.toBeInTheDocument();
  });

  it("renders champion '—' as a plain span, not a Link", async () => {
    // Note: the component filters out host records with year >= 2026,
    // so the dash champion record must use an earlier year.
    const withDashChampion: TournamentStats = {
      ...baseStats,
      host_records: [
        { year: 1930, host: "Uruguay", champion: "Uruguay" },
        { year: 1942, host: "—", champion: "—" },
      ],
    };
    vi.mocked(api.getTournamentStats).mockResolvedValue(withDashChampion);

    renderWithRouter(<Stats />);

    await screen.findByText("Anfitriones");

    // The em-dash is rendered as text in a span, not as a link
    const dashElements = screen.getAllByText("—");
    expect(dashElements.length).toBeGreaterThan(0);
    dashElements.forEach((el) => {
      // None of the rendered "—" should be inside an anchor
      expect(el.closest("a")).toBeNull();
    });
    // No link to /team/— exists
    expect(screen.queryByRole("link", { name: "—" })).not.toBeInTheDocument();
    // But real champions are still rendered as links (Uruguay appears in both
    // champion_counts and host_records, so at least one link exists)
    expect(screen.getAllByRole("link", { name: /Uruguay/ }).length).toBeGreaterThan(0);
  });

  it("renders champion countries as Links pointing to /team/:country", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    await screen.findByText("Campeones");

    const brazilLink = screen.getByRole("link", { name: /Brazil/ });
    expect(brazilLink).toHaveAttribute("href", "/team/Brazil");

    const germanyLink = screen.getByRole("link", { name: /Germany/ });
    expect(germanyLink).toHaveAttribute("href", "/team/Germany");
  });

  it("renders host records with 'Campeón' badge when host equals champion", async () => {
    vi.mocked(api.getTournamentStats).mockResolvedValue(baseStats);

    renderWithRouter(<Stats />);

    await screen.findByText("Anfitriones");
    // Uruguay 1930: host and champion are both Uruguay → "Campeón" badge
    expect(screen.getAllByText("Campeón").length).toBeGreaterThan(0);
  });
});

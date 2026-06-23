import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventTimeline } from "./EventTimeline";
import type { StatsBombTimelineEvent } from "../../lib/types";

describe("EventTimeline", () => {
  // Events are pre-sorted by minute (as parseEvents() would return them)
  const events: StatsBombTimelineEvent[] = [
    { minute: 36, type: "goal", team: "Germany", player: "Thomas Müller" },
    { minute: 45, type: "card", team: "Argentina", player: "Javier Mascherano", cardType: "yellow" },
    {
      minute: 70,
      type: "substitution",
      team: "Germany",
      player: "Sub On",
      substitution: { playerOff: "Sub Off", playerOn: "Sub On" },
    },
    { minute: 88, type: "card", team: "Germany", player: "Player X", cardType: "red" },
  ];

  it("shows event minutes", () => {
    render(<EventTimeline events={events} />);
    expect(screen.getByText("36'")).toBeInTheDocument();
    expect(screen.getByText("45'")).toBeInTheDocument();
    expect(screen.getByText("70'")).toBeInTheDocument();
    expect(screen.getByText("88'")).toBeInTheDocument();
  });

  it("shows player names", () => {
    render(<EventTimeline events={events} />);
    expect(screen.getByText("Thomas Müller")).toBeInTheDocument();
    expect(screen.getByText("Javier Mascherano")).toBeInTheDocument();
  });

  it("shows substitution text with both player names", () => {
    render(<EventTimeline events={events} />);
    // The substitution renders as "Sub On ← Sub Off" in a single span
    expect(screen.getByText(/Sub On.*Sub Off/)).toBeInTheDocument();
  });

  it("shows card type labels", () => {
    render(<EventTimeline events={events} />);
    expect(screen.getByText("AMARILLA")).toBeInTheDocument();
    expect(screen.getByText("ROJA")).toBeInTheDocument();
  });

  it("renders events in rendered order (pre-sorted by container)", () => {
    render(<EventTimeline events={events} />);
    const minutes = screen.getAllByText(/\d+'/);
    const displayedMinutes = minutes.map((el) => el.textContent);
    expect(displayedMinutes[0]).toBe("36'");
    expect(displayedMinutes[1]).toBe("45'");
    expect(displayedMinutes[2]).toBe("70'");
    expect(displayedMinutes[3]).toBe("88'");
  });

  it("shows fallback when no events", () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByText("No hay eventos disponibles")).toBeInTheDocument();
  });

  it("shows team names", () => {
    render(<EventTimeline events={events} />);
    const germanTeams = screen.getAllByText("Germany");
    expect(germanTeams.length).toBeGreaterThanOrEqual(2); // goal + card
    expect(screen.getByText("Argentina")).toBeInTheDocument();
  });

  it("handles events with only goal type gracefully", () => {
    const onlyGoals: StatsBombTimelineEvent[] = [
      { minute: 10, type: "goal", team: "Brazil", player: "Pelé" },
    ];
    render(<EventTimeline events={onlyGoals} />);
    expect(screen.getByText("10'")).toBeInTheDocument();
    expect(screen.getByText("Pelé")).toBeInTheDocument();
  });
});

import type { Group, Team, Venue, Match, TvChannel, HistoricalTournamentSummary, HistoricalTournament, HistoricalMatch, HistoricalTeamMatch } from "./types";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/tournament`
  : "/api/tournament";

async function fetchApi<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
}

export async function getGroups(): Promise<Group[]> {
  return fetchApi<Group[]>("/groups");
}

export async function getTeams(): Promise<Team[]> {
  return fetchApi<Team[]>("/teams");
}

export async function getVenues(): Promise<Venue[]> {
  return fetchApi<Venue[]>("/venues");
}

export async function getMatches(signal?: AbortSignal): Promise<Match[]> {
  return fetchApi<Match[]>("/matches", signal);
}

export async function getMatch(id: string, signal?: AbortSignal): Promise<Match | null> {
  return fetchApi<Match | null>(`/matches/${id}`, signal);
}

export async function getTv(): Promise<TvChannel[]> {
  return fetchApi<TvChannel[]>("/tv");
}

export async function getUpcomingMatches(limit = 5): Promise<Match[]> {
  const matches = await fetchApi<Match[]>("/matches");
  const now = new Date();
  return matches
    .filter((m) => {
      const matchDate = new Date(`${m.date}T${m.time || "00:00"}`);
      return matchDate > now || m.status === "scheduled";
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, limit);
}

export async function getFeaturedVenues(limit = 4): Promise<Venue[]> {
  const venues = await fetchApi<Venue[]>("/venues");
  return venues.slice(0, limit);
}

const HISTORICAL_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/historical`
  : "/api/historical";

async function fetchHistorical<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${HISTORICAL_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
}

export async function getHistoricalTournaments(): Promise<HistoricalTournamentSummary[]> {
  return fetchHistorical<HistoricalTournamentSummary[]>("/tournaments");
}

export async function getHistoricalTournament(year: number): Promise<HistoricalTournament> {
  const data = await fetchHistorical<HistoricalTournament>(`/tournaments/${year}`);
  return {
    ...data,
    matches: data.matches.map((m) => ({
      ...m,
      id: `${year}-${m.team1.name.toLowerCase().replace(/\s+/g, "-")}-vs-${m.team2.name.toLowerCase().replace(/\s+/g, "-")}`,
    })),
  };
}

export async function getTeamMatches(teamName: string): Promise<HistoricalTeamMatch[]> {
  return fetchHistorical<HistoricalTeamMatch[]>(
    `/teams/${encodeURIComponent(teamName)}/matches`
  );
}

export async function getHeadToHead(team1: string, team2: string): Promise<HistoricalMatch[]> {
  return fetchHistorical<HistoricalMatch[]>(
    `/head-to-head?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`
  );
}
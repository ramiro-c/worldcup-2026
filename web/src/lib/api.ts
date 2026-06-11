import type { Group, Team, Venue, Match, TvChannel, HistoricalTournamentSummary, HistoricalTournament, HistoricalMatch } from "./types";

const API_BASE = "/api/tournament";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
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

export async function getMatches(): Promise<Match[]> {
  return fetchApi<Match[]>("/matches");
}

export async function getMatch(id: string): Promise<Match | null> {
  return fetchApi<Match | null>(`/matches/${id}`);
}

export async function getTv(): Promise<TvChannel[]> {
  return fetchApi<TvChannel[]>("/tv");
}

const HISTORICAL_BASE = "/api/historical";

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

export async function getHeadToHead(team1: string, team2: string): Promise<HistoricalMatch[]> {
  return fetchHistorical<HistoricalMatch[]>(
    `/head-to-head?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`
  );
}
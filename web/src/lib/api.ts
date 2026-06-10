import type { Group, Team, Venue, Match, TvChannel } from "./types";

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

export async function getTv(): Promise<TvChannel[]> {
  return fetchApi<TvChannel[]>("/tv");
}
export interface Team {
  id: string;
  name: string;
  code: string;
  crest: string;
  group: string;
}

export interface Group {
  id: string;
  name: string;
  teams: string[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  latitude: number;
  longitude: number;
  region: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  venue: string;
  date: string;
  time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  group?: string;
  round?: string;
  phase?: string;
  venue_city?: string;
  datetime_utc?: string;
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
  home_crest?: string;
  away_crest?: string;
}

export interface TvChannel {
  id: string;
  name: string;
  country: string;
}

export interface HistoricalTournamentSummary {
  year: number;
  name: string;
  host: string;
}

export interface HistoricalTeam {
  name: string;
  is_winner: boolean;
}

export interface HistoricalScorer {
  player: string;
  minute: number;
  penalty: boolean;
  team: string;
}

export interface HistoricalMatch {
  id: string;
  date: string | null;
  time: string | null;
  team1: HistoricalTeam;
  team2: HistoricalTeam;
  score: string;
  ht_score: string | null;
  has_extra_time: boolean;
  penalty_score: string | null;
  venue: string;
  scorers: HistoricalScorer[];
  stage: string;
  group_name: string | null;
}

export interface HistoricalGroup {
  name: string;
  teams: string[];
}

export interface HistoricalTeamMatch extends HistoricalMatch {
  tournament_year: number;
  tournament_name: string;
}

export interface BracketMatch {
  id: string;
  round: string;
  slot: number;
  home_team: string | null;
  away_team: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_crest: string | null;
  away_crest: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  next_match_id: string | null;
}

export interface BracketRound {
  name: string;
  label: string;
  matches: BracketMatch[];
}

export interface HistoricalTournament {
  year: number;
  host: string;
  name: string;
  groups: HistoricalGroup[];
  matches: HistoricalMatch[];
}
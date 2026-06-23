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

export interface HistoricalTournament {
  year: number;
  host: string;
  name: string;
  groups: HistoricalGroup[];
  matches: HistoricalMatch[];
}

export interface HeadToHeadMeeting {
  year: number | null;
  date: string | null;
  stage: string;
  score: string;
  winner: string | null;
}

export interface HeadToHeadSummary {
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  last_meetings: HeadToHeadMeeting[];
  last_meeting: HeadToHeadMeeting | null;
}

export interface EnrichedMatchResponse {
  match: Match;
  head_to_head: HeadToHeadSummary | null;
}
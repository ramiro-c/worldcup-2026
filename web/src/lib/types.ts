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

// StatsBomb data types
export interface StatsBombCompetition {
  competition_id: number;
  season_id: number;
  competition_name: string;
  season_name: string;
}

export interface StatsBombTimelineEvent {
  minute: number;
  type: "goal" | "card" | "substitution";
  team: string;
  player: string;
  cardType?: "yellow" | "red";
  substitution?: {
    playerOff: string;
    playerOn: string;
  };
}

export interface StatsBombShot {
  x: number;
  y: number;
  outcome: "goal" | "saved" | "blocked" | "off_target" | "wayward";
}

export interface StatsBombLineupPlayer {
  player: string;
  jerseyNumber: number;
  position?: string;
}

export interface StatsBombLineup {
  team: string;
  startingXI: StatsBombLineupPlayer[];
  substitutes: StatsBombLineupPlayer[];
}

export interface ChampionCount {
  country: string;
  count: number;
}

export interface BiggestWin {
  year: number;
  team1: string;
  team2: string;
  score: string;
  margin: number;
  stage: string;
}

export interface HostRecord {
  year: number;
  host: string;
  champion: string;
}

export interface TopScorer {
  player: string;
  team: string;
  goals: number;
  tournaments: number[];
}

export interface TournamentStats {
  champion_counts: ChampionCount[];
  biggest_wins: BiggestWin[];
  total_goals: {
    overall: number;
    avg_per_tournament: number;
  };
  host_records: HostRecord[];
  top_scorers: TopScorer[];
  skipped_tournaments?: number[];
}
}